from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi import status
import json
import random
import joblib
import os
import pandas as pd
import urllib.request
import urllib.parse
import urllib.error
import re
import numpy as np
import time

from app.schemas.api_schemas import PricePredictionResult, HealthInputSchema, HealthAssessmentResult
from app.services.agents.health_agent import HealthAgent
from pydantic import BaseModel, Field

app = FastAPI(title="Tattoo AI API", version="1.0.0")
api_base_url = f"http://localhost:{os.getenv('PORT', '8001')}"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static dataset folder
dataset_path = os.path.join(os.path.dirname(__file__), 'dataset')
if os.path.exists(dataset_path):
    app.mount("/dataset", StaticFiles(directory=dataset_path), name="dataset")

reference_dataset_path = os.getenv(
    "TATTOO_IMAGE_DATASET",
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dataset', 'Tattoo_img_200')),
)
if os.path.isdir(reference_dataset_path):
    app.mount("/reference-dataset", StaticFiles(directory=reference_dataset_path), name="reference-dataset")

# Load the ML model
model_path = os.path.join(os.path.dirname(__file__), '../../ml/saved_models/price_prediction_model.joblib')
try:
    price_model = joblib.load(model_path)
    print("Price prediction model loaded successfully.")
except Exception as e:
    print(f"Warning: Could not load model at {model_path}. Error: {e}")
    price_model = None

# Initialize AI Agents
health_agent = HealthAgent()

# Initialize CLIP and KNN for Image Search
clip_model = None
clip_files = None
clip_embeddings = None
knn_model = None

if os.getenv("ENABLE_CLIP_SEARCH", "false").lower() == "true":
    try:
        from sentence_transformers import SentenceTransformer
        from sklearn.neighbors import NearestNeighbors

        print("Loading CLIP model for image search...")
        clip_model = SentenceTransformer('clip-ViT-B-32')

        embeddings_path = os.path.join(dataset_path, 'embeddings.joblib')
        if os.path.exists(embeddings_path):
            print(f"Loading precomputed embeddings from {embeddings_path}...")
            data = joblib.load(embeddings_path)
            clip_files = data['files']
            clip_embeddings = data['embeddings']

            knn_model = NearestNeighbors(n_neighbors=8, metric='cosine')
            knn_model.fit(clip_embeddings)
            print("CLIP Model and Embeddings loaded successfully.")
        else:
            print("Embeddings file not found. Image search will fallback to random.")
    except Exception as e:
        print(f"Warning: Could not initialize CLIP image search: {e}")
else:
    print("CLIP search disabled; using dataset fallback for images.")


class PricePredictionRequest(BaseModel):
    country: str
    city: str
    size_sq_inches: float
    body_part: str
    tattoo_style: str
    complexity: int
    is_color: int
    color_count: int
    shading_level: int
    ink_brand: str = "No Preference"
    artist_level: str = "Established"
    design_type: str = "Custom design"

class TattooImageGenerationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=500)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Tattoo AI API"}

@app.post("/api/price/predict", response_model=PricePredictionResult)
def predict_price(request: PricePredictionRequest):
    if price_model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The tattoo price prediction model is unavailable.",
        )

    country_aliases = {
        "US": "USA",
        "UNITED STATES": "USA",
        "IN": "India",
        "UK": "UK",
        "GB": "UK",
        "UNITED KINGDOM": "UK",
        "AU": "Australia",
    }
    country = country_aliases.get(request.country.strip().upper(), request.country.strip())
    complexity_score = (
        request.complexity
        if request.complexity <= 4
        else min(4, max(1, round(1 + (request.complexity - 1) / 3)))
    )
    color_type = (
        "Black and grey"
        if not request.is_color
        else "Single color"
        if request.color_count <= 1
        else "Color"
    )
    placement_aliases = {
        "arm": "Upper Arm",
        "full sleeve": "Upper Arm",
        "half sleeve": "Upper Arm",
        "chest": "Chest & Torso",
        "chest and torso": "Chest & Torso",
        "finger": "Fingers",
        "ribs": "Ribs",
    }
    style_aliases = {
        "3d effect": "3D",
        "black and grey": "Blackwork",
    }
    design_type_aliases = {
        "semi-custom": "Custom from reference",
        "fully custom": "Custom design",
    }
    input_data = pd.DataFrame(
        [
            {
                "size_sq_inches": request.size_sq_inches,
                "complexity_score": complexity_score,
                "country": country,
                "city": request.city,
                "body_part": placement_aliases.get(
                    request.body_part.strip().lower(), request.body_part.strip()
                ),
                "tattoo_style": style_aliases.get(
                    request.tattoo_style.strip().lower(), request.tattoo_style.strip()
                ),
                "color_type": color_type,
                "artist_level": request.artist_level,
                "design_type": design_type_aliases.get(
                    request.design_type.strip().lower(), request.design_type
                ),
            }
        ]
    )

    ink_premiums = {
        "Kuro Sumi": 50,
        "Xtreme Ink": 30,
        "Eternal Ink": 20,
        "Dynamic Color": 20,
        "Intenze Tattoo Ink": 20,
    }
    ink_brand = request.ink_brand
    ink_premium = ink_premiums.get(ink_brand, 0)
    predicted_price = price_model.predict(input_data)[0] + ink_premium
    forest = price_model.named_steps["model"]
    transformed_input = price_model.named_steps["preprocessor"].transform(input_data)
    tree_predictions = [tree.predict(transformed_input)[0] for tree in forest.estimators_]
    min_price = max(0, round(float(np.percentile(tree_predictions, 10)) + ink_premium, 2))
    max_price = max(
        min_price, round(float(np.percentile(tree_predictions, 90)) + ink_premium, 2)
    )

    return PricePredictionResult(
        predicted_price_mid=round(predicted_price, 2),
        predicted_price_min=min_price,
        predicted_price_max=max_price,
        factors=[
            f"Style: {request.tattoo_style}",
            f"Size: {request.size_sq_inches} sq inches",
            f"Complexity: {complexity_score}/4",
            f"Location: {request.city}, {country}",
            f"Artist level: {request.artist_level}",
            f"Color: {color_type}",
            f"Design type: {request.design_type}",
            f"Ink brand: {ink_brand}",
            "Model trained on supplied tattoo price dataset; amounts are USD",
        ]
    )

@app.post("/api/health-analysis", response_model=HealthAssessmentResult)
def analyze_health(request: HealthInputSchema):
    result = health_agent.analyze(request)
    return result

@app.get("/api/images/search")
def search_images(q: str = ""):
    try:
        if q and q.strip():
            unique_urls = []
            found_good_match = False
            
            # Attempt to search local dataset first
            if clip_model is not None and knn_model is not None:
                text_emb = clip_model.encode([q.strip()])
                n_results = min(8, len(clip_files))
                distances, indices = knn_model.kneighbors(text_emb, n_neighbors=n_results)
                
                # Check if the best match is good enough (e.g. distance < 0.3)
                if distances[0][0] < 0.3:
                    found_good_match = True
                    
                for idx in indices[0]:
                    filename = clip_files[idx]
                    unique_urls.append(f"{api_base_url}/dataset/{filename}")
                    
            if found_good_match and unique_urls:
                return {"images": unique_urls}

            # Fallback to Vecteezy if no good match in local dataset
            try:
                encoded_query = urllib.parse.quote_plus(q.strip() + " tattoo")
                url = f"https://www.vecteezy.com/free-vector/{encoded_query}"
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'})
                html = urllib.request.urlopen(req).read().decode('utf-8')
                
                urls = re.findall(r'src="(https://static\.vecteezy\.com/system/resources/thumbnails/[^"]+)"', html)
                
                unique_vecteezy_urls = []
                for u in urls:
                    if u not in unique_vecteezy_urls:
                        unique_vecteezy_urls.append(u)
                    if len(unique_vecteezy_urls) >= 8:
                        break
                        
                if unique_vecteezy_urls:
                    return {"images": unique_vecteezy_urls}
            except Exception as vecteezy_err:
                print(f"Vecteezy search failed: {vecteezy_err}")

            # If Vecteezy fails or returns no results, return whatever local results we had (even if poor matches)
            if unique_urls:
                return {"images": unique_urls}

        # Fallback to dataset if no query provided or search failed
        dataset_dir = os.path.join(os.path.dirname(__file__), 'dataset')
        if not os.path.exists(dataset_dir):
            return {"images": []}
            
        all_images = [f for f in os.listdir(dataset_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
        if not all_images:
            return {"images": []}
            
        # Select up to 8 random images
        selected = random.sample(all_images, min(8, len(all_images)))
        image_urls = [f"{api_base_url}/dataset/{img}" for img in selected]
        
        return {"images": image_urls}
    except Exception as e:
        print(f"Error fetching images: {e}")
        # Try fallback again on error
        try:
            dataset_dir = os.path.join(os.path.dirname(__file__), 'dataset')
            all_images = [f for f in os.listdir(dataset_dir) if f.endswith(('.png', '.jpg', '.jpeg'))]
            if all_images:
                selected = random.sample(all_images, min(8, len(all_images)))
                return {"images": [f"{api_base_url}/dataset/{img}" for img in selected]}
        except:
            pass
        return {"images": []}

@app.get("/api/images/random")
def get_random_reference_images():
    if not os.path.isdir(reference_dataset_path):
        raise HTTPException(status_code=503, detail="The tattoo reference image dataset is unavailable.")

    allowed_extensions = ('.png', '.jpg', '.jpeg', '.webp', '.gif')
    image_files = [
        filename for filename in os.listdir(reference_dataset_path)
        if filename.lower().endswith(allowed_extensions)
        and os.path.isfile(os.path.join(reference_dataset_path, filename))
    ]
    if len(image_files) < 6:
        raise HTTPException(status_code=503, detail="The tattoo reference dataset does not contain six images.")

    selected_images = random.sample(image_files, 6)
    return {
        "images": [f"{api_base_url}/reference-dataset/{urllib.parse.quote(filename)}" for filename in selected_images]
    }

@app.post("/api/images/generate")
def generate_tattoo_image(request: TattooImageGenerationRequest):
    prompt = (
        "Tattoo flash design concept, isolated centered artwork, clean plain white background, "
        "crisp intentional linework, suitable for review with a tattoo artist. "
        f"Design description: {request.prompt.strip()}"
    )
    horde_base_url = "https://aihorde.net/api/v2"
    horde_headers = {
        "apikey": "0000000000",
        "Client-Agent": "TattooPriceCalculator:1.0.0",
        "User-Agent": "TattooPriceCalculator/1.0.0",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    def horde_request(path: str, payload: dict | None = None) -> dict:
        body = json.dumps(payload).encode() if payload is not None else None
        headers = dict(horde_headers)
        if body is None:
            headers.pop("Content-Type")
        horde_req = urllib.request.Request(
            f"{horde_base_url}{path}",
            data=body,
            headers=headers,
            method="POST" if body is not None else "GET",
        )
        with urllib.request.urlopen(horde_req, timeout=30) as response:
            result = json.loads(response.read().decode("utf-8"))
        if not isinstance(result, dict):
            raise ValueError("AI Horde returned a non-object response.")
        return result

    try:
        submission = horde_request(
            "/generate/async",
            {
                "prompt": prompt,
                "params": {
                    "width": 512,
                    "height": 512,
                    "steps": 8,
                },
                "models": ["stable_diffusion"],
            },
        )
        request_id = submission.get("id")
        if not isinstance(request_id, str) or not request_id:
            raise ValueError("AI Horde did not return a generation request ID.")

        deadline = time.monotonic() + 180
        while time.monotonic() < deadline:
            time.sleep(5)
            check = horde_request(f"/generate/check/{urllib.parse.quote(request_id, safe='')}")
            if check.get("faulted"):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="The free community image service could not complete this design. Please try again.",
                )
            if check.get("done"):
                result = horde_request(f"/generate/status/{urllib.parse.quote(request_id, safe='')}")
                generations = result.get("generations")
                first_generation = generations[0] if isinstance(generations, list) and generations else None
                image_url = first_generation.get("img") if isinstance(first_generation, dict) else None
                if not isinstance(image_url, str) or not image_url.startswith("https://"):
                    raise ValueError("AI Horde did not return a usable image URL.")
                return {"image_url": image_url}
    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8", errors="replace")
        print(f"AI Horde image generation failed with HTTP {error.code}: {error_body[:500]}")
        if error.code == 429:
            detail = "The free community image service is busy. Please wait a little and try again."
        elif error.code == 400:
            detail = "The free community image service rejected this request. Please simplify the design description and try again."
        elif error.code == 403:
            detail = "The free community image service is blocking this connection right now. Please try again later or browse the random designs."
        else:
            detail = "The free community image service could not generate this design. Please try again."
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=detail,
        ) from error
    except (urllib.error.URLError, TimeoutError) as error:
        print(f"AI Horde image generation request failed: {error}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The free community image service is temporarily unavailable. Please try again.",
        ) from error
    except (ValueError, KeyError) as error:
        print(f"AI Horde returned an invalid image-generation response: {error}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The free community image service returned an invalid response. Please try again.",
        ) from error

    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail="The anonymous image-generation queue is taking too long. Try again later or browse the random designs.",
    )
