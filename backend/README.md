# Backend image generation setup

Prompt-based tattoo image generation uses the [AI Horde](https://aihorde.net/) community service. It is free to use and this app submits requests anonymously, so no provider account, API token, or billing setup is required.

Anonymous requests have the lowest queue priority. Generation can take a while or time out when the community queue is busy. The app requests one 512 x 512 image and waits up to three minutes for the result. Prompts are sent to a third-party community service; do not include private or sensitive information.

The **Generate from prompt** action returns a tattoo concept for discussion with a tattoo artist, not stencil-ready artwork. The service and generated image URLs may be unavailable or temporary. For a no-cost alternative that does not send prompts to a hosted service, use **No preference** to browse the local reference dataset.

The local **No preference** images are served from `dataset/Tattoo_img_200` at the project root. Set `TATTOO_IMAGE_DATASET` to use a different image directory. Leaving the prompt blank and selecting **Generate from prompt** also loads six random images from this local dataset.

## Price prediction model

Price predictions are produced in USD by the model trained from `ml/data/tattoo_price_dataset_v3.csv`. The matching `tattoo_price_model_ready_v3.csv` is included for reference; it contains the same 100,000 records with a reduced set of columns and is not concatenated during training. The source dataset labels its records `anchored_synthetic`, so predictions are estimates based on that data, not guaranteed studio quotes.

To retrain after changing the training data, run `python ml/train.py` from the project root using the backend Python environment. The script evaluates a held-out split and writes `ml/saved_models/price_prediction_model.joblib`; restart the backend afterward to load the new model. The API converts size, placement, color, artist level, and design type into the model's training features. The main calculator converts the USD prediction to the selected display currency when exchange rates are available.

See the [AI Horde API documentation](https://aihorde.net/api) and the [AI Horde integration guide](https://github.com/Haidra-Org/AI-Horde/blob/main/README_integration.md) for service details.
