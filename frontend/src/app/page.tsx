"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import BodyAreaPicker from '../components/BodyAreaPicker';
import { currencyForCountry, formatCurrency, getCurrencySymbol, useUsdExchangeRates } from '../lib/currency';

const navItems = ['AI Generator', 'Font Generator', 'Try On', 'Styles', 'Tools', 'Pricing'];
const complexityOptions = ['Simple', 'Medium', 'Complex', 'Intricate'];
const sizeAreaEstimates: Record<string, number> = {
  tiny: 2.5,
  small: 6.5,
  medium: 12.5,
  large: 20.4,
  'small-custom': 6.5,
  'medium-custom': 12.5,
  'large-standalone': 37.3,
  'half-sleeve': 89.4,
  'full-sleeve': 204.4,
  'full-back': 400.2,
};
const artistLevelNames: Record<string, string> = {
  'starting-out': 'Starting Out',
  apprentice: 'Apprentice',
  established: 'Established',
  experienced: 'Experienced',
  'popular-artist': 'Popular Artist',
  'world-class-artist': 'World-Class Artist',
};
const datasetCountryByCity: Record<string, string> = {
  Austin: 'USA',
  Chicago: 'USA',
  'Los Angeles': 'USA',
  Miami: 'USA',
  'New York': 'USA',
  'San Francisco': 'USA',
  'United States Average': 'USA',
  Bengaluru: 'India',
  Chennai: 'India',
  Hyderabad: 'India',
  Kochi: 'India',
  Kolkata: 'India',
  Mangaluru: 'India',
  Mumbai: 'India',
  'New Delhi': 'India',
  Pune: 'India',
  Melbourne: 'Australia',
  Sydney: 'Australia',
  London: 'UK',
  'Other UK': 'UK',
  'United Kingdom Average': 'UK',
  'Australia Average': 'Australia',
  'Asia Average': 'India',
};

type LocationOption = {
  label: string;
  value: string;
};

type PriceExample = {
  label: string;
  location: string;
  artistLevel: string;
  size: string;
  placement: string;
  style: string;
  complexity: string;
  designType: string;
  color: string;
};

type DatasetPricePrediction = {
  predicted_price_min: number;
  predicted_price_max: number;
  predicted_price_mid: number;
  factors: string[];
};

const priceExamples: PriceExample[] = [
  {
    label: 'Tiny wrist fine line',
    location: 'New York',
    artistLevel: 'established',
    size: 'tiny',
    placement: 'Wrist',
    style: 'Fine Line',
    complexity: 'Simple',
    designType: 'Flash design',
    color: 'black-and-grey',
  },
  {
    label: 'Medium forearm realism',
    location: 'New York',
    artistLevel: 'experienced',
    size: 'medium',
    placement: 'Forearm',
    style: 'Realism',
    complexity: 'Complex',
    designType: 'Semi-custom',
    color: 'black-and-grey',
  },
  {
    label: 'Half sleeve Japanese',
    location: 'New York',
    artistLevel: 'popular-artist',
    size: 'half-sleeve',
    placement: 'Half Sleeve',
    style: 'Japanese',
    complexity: 'Intricate',
    designType: 'Fully custom',
    color: 'full-color',
  },
];

const countryCapitalSuggestions: LocationOption[] = [
  { label: 'United States — Washington, D.C.', value: 'Washington, D.C.' },
  { label: 'Canada — Ottawa', value: 'Ottawa' },
  { label: 'United Kingdom — London', value: 'London' },
  { label: 'France — Paris', value: 'Paris' },
  { label: 'Germany — Berlin', value: 'Berlin' },
  { label: 'Italy — Rome', value: 'Rome' },
  { label: 'Spain — Madrid', value: 'Madrid' },
  { label: 'Netherlands — Amsterdam', value: 'Amsterdam' },
  { label: 'Belgium — Brussels', value: 'Brussels' },
  { label: 'Portugal — Lisbon', value: 'Lisbon' },
  { label: 'Sweden — Stockholm', value: 'Stockholm' },
  { label: 'Norway — Oslo', value: 'Oslo' },
  { label: 'Denmark — Copenhagen', value: 'Copenhagen' },
  { label: 'Finland — Helsinki', value: 'Helsinki' },
  { label: 'Poland — Warsaw', value: 'Warsaw' },
  { label: 'Turkey — Ankara', value: 'Ankara' },
  { label: 'Greece — Athens', value: 'Athens' },
  { label: 'Russia — Moscow', value: 'Moscow' },
  { label: 'Japan — Tokyo', value: 'Tokyo' },
  { label: 'South Korea — Seoul', value: 'Seoul' },
  { label: 'China — Beijing', value: 'Beijing' },
  { label: 'India — New Delhi', value: 'New Delhi' },
  { label: 'Thailand — Bangkok', value: 'Bangkok' },
  { label: 'Singapore — Singapore', value: 'Singapore' },
  { label: 'Indonesia — Jakarta', value: 'Jakarta' },
  { label: 'Philippines — Manila', value: 'Manila' },
  { label: 'Vietnam — Hanoi', value: 'Hanoi' },
  { label: 'Malaysia — Kuala Lumpur', value: 'Kuala Lumpur' },
  { label: 'Australia — Canberra', value: 'Canberra' },
  { label: 'New Zealand — Wellington', value: 'Wellington' },
  { label: 'United Arab Emirates — Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Saudi Arabia — Riyadh', value: 'Riyadh' },
  { label: 'Egypt — Cairo', value: 'Cairo' },
  { label: 'South Africa — Pretoria', value: 'Pretoria' },
  { label: 'Nigeria — Abuja', value: 'Abuja' },
  { label: 'Kenya — Nairobi', value: 'Nairobi' },
  { label: 'Brazil — Brasília', value: 'Brasília' },
  { label: 'Argentina — Buenos Aires', value: 'Buenos Aires' },
  { label: 'Mexico — Mexico City', value: 'Mexico City' },
  { label: 'Chile — Santiago', value: 'Santiago' },
  { label: 'Colombia — Bogotá', value: 'Bogotá' },
  { label: 'Peru — Lima', value: 'Lima' },
  { label: 'Uruguay — Montevideo', value: 'Montevideo' },
];

const regionalAverageOptions: LocationOption[] = [
  { label: 'United States Average', value: 'United States Average' },
  { label: 'Canada Average', value: 'Canada Average' },
  { label: 'Europe Average', value: 'Europe Average' },
  { label: 'Asia Average', value: 'Asia Average' },
  { label: 'Australia Average', value: 'Australia Average' },
  { label: 'United Kingdom Average', value: 'United Kingdom Average' },
  { label: 'Middle East Average', value: 'Middle East Average' },
  { label: 'Latin America Average', value: 'Latin America Average' },
  { label: 'Global Average', value: 'Global Average' },
];

const locationOptions = [...regionalAverageOptions, ...countryCapitalSuggestions];

const countryCodesByName: Record<string, string> = {
  'United States': 'US',
  Canada: 'CA',
  'United Kingdom': 'GB',
  France: 'FR',
  Germany: 'DE',
  Italy: 'IT',
  Spain: 'ES',
  Netherlands: 'NL',
  Belgium: 'BE',
  Portugal: 'PT',
  Sweden: 'SE',
  Norway: 'NO',
  Denmark: 'DK',
  Finland: 'FI',
  Poland: 'PL',
  Turkey: 'TR',
  Greece: 'GR',
  Russia: 'RU',
  Japan: 'JP',
  'South Korea': 'KR',
  China: 'CN',
  India: 'IN',
  Thailand: 'TH',
  Singapore: 'SG',
  Indonesia: 'ID',
  Philippines: 'PH',
  Vietnam: 'VN',
  Malaysia: 'MY',
  Australia: 'AU',
  'New Zealand': 'NZ',
  'United Arab Emirates': 'AE',
  'Saudi Arabia': 'SA',
  Egypt: 'EG',
  'South Africa': 'ZA',
  Nigeria: 'NG',
  Kenya: 'KE',
  Brazil: 'BR',
  Argentina: 'AR',
  Mexico: 'MX',
  Chile: 'CL',
  Colombia: 'CO',
  Peru: 'PE',
  Uruguay: 'UY',
};

const regionalCurrencies: Record<string, string> = {
  'United States Average': 'USD',
  'Canada Average': 'CAD',
  'Europe Average': 'EUR',
  'Asia Average': 'USD',
  'Australia Average': 'AUD',
  'United Kingdom Average': 'GBP',
  'Middle East Average': 'USD',
  'Latin America Average': 'USD',
  'Global Average': 'USD',
};

const cityCountryCodes: Record<string, string> = {
  'New York': 'US',
  'San Francisco': 'US',
  'Los Angeles': 'US',
  Toronto: 'CA',
  Vancouver: 'CA',
};

const placementSections = [
  {
    label: 'Arms and legs',
    options: ['Forearm', 'Full Sleeve', 'Half Sleeve', 'Thigh', 'Hand', 'Wrist', 'Band', 'Calf', 'Finger', 'Ankle'],
  },
  {
    label: 'Torso and sensitive areas',
    options: ['Shoulder', 'Back', 'Chest', 'Sternum', 'Ribs', 'Neck'],
  },
];

const styleSections = [
  {
    label: 'Common styles',
    options: ['Black and Grey', 'Blackwork', 'Realism', 'Minimalist', 'Neo-Traditional', 'Sketch', 'Traditional', 'Geometric', 'Japanese', 'Stencil', 'Fine Line'],
  },
  {
    label: 'Special styles',
    options: ['Trash Polka', 'Dotwork', 'Tribal', 'Surrealism', 'New School', 'Watercolor', 'Anime', 'Ignorant', '3D Effect', 'Woodcut', 'Horror', 'Gothic', 'Chicano', 'Graffiti', 'Abstract', 'Cyber Sigilism', 'Biomechanical'],
  },
];

type GuideTableProps = {
  headers: string[];
  rows: string[][];
  formatPrice?: (amount: number) => string;
};

function GuideTable({ headers, rows, formatPrice }: GuideTableProps) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#e5e5e5] text-[#555]">
            {headers.map((header) => (
              <th key={header} className="px-2 py-2 font-semibold">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-[#e9e9e9] last:border-b-0">
              {row.map((cell, index) => (
                <td key={`${row[0]}-${index}`} className="px-2 py-2 align-top">
                  {formatPrice
                    ? cell.replace(/\$([\d,]+)(?:\s*-\s*\$?([\d,]+))?/g, (_range, min: string, max?: string) => {
                        const minimum = formatPrice(Number(min.replace(/,/g, '')));
                        return max
                          ? `${minimum} - ${formatPrice(Number(max.replace(/,/g, '')))}`
                          : minimum;
                      })
                    : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Home() {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  const [query, setQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');
  const [isBodyAreaOpen, setIsBodyAreaOpen] = useState(false);
  const [selectedBodyArea, setSelectedBodyArea] = useState('');
  const [uploadedImage, setUploadedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [placementSearch, setPlacementSearch] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState('');
  const [showPlacementOptions, setShowPlacementOptions] = useState(false);
  const [styleSearch, setStyleSearch] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [selectedComplexity, setSelectedComplexity] = useState('Medium');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(true);
  const [selectedDesignType, setSelectedDesignType] = useState('Semi-custom');
  const [artistExperience, setArtistExperience] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [datasetPricePrediction, setDatasetPricePrediction] = useState<DatasetPricePrediction | null>(null);
  const [pricePredictionError, setPricePredictionError] = useState('');
  const [isPredictingPrice, setIsPredictingPrice] = useState(false);
  const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedReferenceImages, setGeneratedReferenceImages] = useState<string[]>([]);
  const [pendingGeneratedImage, setPendingGeneratedImage] = useState<string | null>(null);
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState<string | null>(null);
  const [isLoadingGeneratedImages, setIsLoadingGeneratedImages] = useState(false);
  const [imageGenerationMode, setImageGenerationMode] = useState<'prompt' | 'random' | null>(null);
  const [imageGenerationError, setImageGenerationError] = useState('');
  const [generatedImageSource, setGeneratedImageSource] = useState<'prompt' | 'random' | null>(null);
  const { rates, isLoaded: areExchangeRatesLoaded, hasError: exchangeRatesFailed } = useUsdExchangeRates();
  const currencyCode = useMemo(() => {
    const regionalCurrency = regionalCurrencies[selectedLocation];
    if (regionalCurrency) return regionalCurrency;

    const selectedOption = countryCapitalSuggestions.find((option) => option.value === selectedLocation);
    const countryName = selectedOption?.label.split(' — ')[0];
    const countryCode = countryName
      ? countryCodesByName[countryName]
      : countryCodesByName[selectedLocation] ?? cityCountryCodes[selectedLocation];
    return currencyForCountry(countryCode);
  }, [selectedLocation]);
  const hasCurrencyRate = currencyCode === 'USD' || typeof rates[currencyCode] === 'number';
  const displayCurrencyCode = hasCurrencyRate ? currencyCode : 'USD';
  const formatEstimatePrice = (amount: number) =>
    formatCurrency(amount * (displayCurrencyCode === 'USD' ? 1 : rates[displayCurrencyCode]), displayCurrencyCode);

  useEffect(() => {
    return () => {
      if (uploadedImage) URL.revokeObjectURL(uploadedImage.previewUrl);
    };
  }, [uploadedImage]);

  const estimateInputsComplete = Boolean(
    selectedLocation && artistExperience && selectedSize && selectedPlacement && selectedStyle && selectedColor
  );
  const outputDesignImage = uploadedImage?.previewUrl ?? selectedGeneratedImage;
  const clearPricePrediction = () => {
    setDatasetPricePrediction(null);
    setPricePredictionError('');
  };

  useEffect(() => {
    if (!selectedLocation && !query) {
      setQuery('');
    }
  }, [selectedLocation, query]);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return locationOptions.slice(0, 14);
    }

    return locationOptions.filter((item) => {
      const text = `${item.label} ${item.value}`.toLowerCase();
      return text.includes(normalized);
    }).slice(0, 14);
  }, [query]);

  const filteredPlacementSections = placementSections
    .map((section) => ({
      ...section,
      options: section.options.filter((option) => option.toLowerCase().includes(placementSearch.trim().toLowerCase())),
    }))
    .filter((section) => section.options.length > 0);

  const filteredStyleSections = styleSections
    .map((section) => ({
      ...section,
      options: section.options.filter((option) => option.toLowerCase().includes(styleSearch.trim().toLowerCase())),
    }))
    .filter((section) => section.options.length > 0);

  const handleSelectLocation = (value: string) => {
    clearPricePrediction();
    setSelectedLocation(value);
    setQuery(value);
    setShowSuggestions(false);
  };

  const handleApplyPriceExample = (example: PriceExample) => {
    handleSelectLocation(example.location);
    clearPricePrediction();
    setArtistExperience(example.artistLevel);
    setSelectedSize(example.size);
    setSelectedPlacement(example.placement);
    setPlacementSearch('');
    setSelectedStyle(example.style);
    setStyleSearch('');
    setSelectedComplexity(example.complexity);
    setSelectedDesignType(example.designType);
    setSelectedColor(example.color);
  };

  const handleCalculatePrice = async () => {
    if (!estimateInputsComplete) return;

    clearPricePrediction();
    setIsPredictingPrice(true);
    const locationOption = countryCapitalSuggestions.find((option) => option.value === selectedLocation);
    const selectedCountry = locationOption?.label.split(' — ')[0];
    const countryNameByLabel: Record<string, string> = {
      'United States': 'USA',
      India: 'India',
      Australia: 'Australia',
      'United Kingdom': 'UK',
    };
    const country =
      datasetCountryByCity[selectedLocation] ??
      (selectedCountry ? countryNameByLabel[selectedCountry] : undefined) ??
      'Other';
    const complexityScore: Record<string, number> = {
      Simple: 1,
      Medium: 2,
      Complex: 3,
      Intricate: 4,
    };
    const colorCount = selectedColor === 'black-and-grey' ? 1 : selectedColor === 'limited-color' ? 2 : 5;

    try {
      const response = await fetch(`${API_BASE_URL}/api/price/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country,
          city: selectedLocation,
          size_sq_inches: sizeAreaEstimates[selectedSize],
          body_part: selectedPlacement,
          tattoo_style: selectedStyle,
          complexity: complexityScore[selectedComplexity],
          is_color: selectedColor === 'black-and-grey' ? 0 : 1,
          color_count: colorCount,
          shading_level: complexityScore[selectedComplexity],
          artist_level: artistLevelNames[artistExperience],
          design_type: selectedDesignType,
        }),
      });
      const result = await response.json() as DatasetPricePrediction & { detail?: string };
      if (!response.ok) {
        throw new Error(result.detail || `Price prediction failed with status ${response.status}.`);
      }
      if (
        !Number.isFinite(result.predicted_price_min) ||
        !Number.isFinite(result.predicted_price_max) ||
        !Number.isFinite(result.predicted_price_mid) ||
        !Array.isArray(result.factors)
      ) {
        throw new Error('The price prediction service returned an invalid estimate.');
      }
      setDatasetPricePrediction(result);
    } catch (error) {
      setPricePredictionError(error instanceof Error ? error.message : 'Unable to predict this tattoo price.');
    } finally {
      setIsPredictingPrice(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageUploadError('Choose an image file to use as a tattoo reference.');
      event.target.value = '';
      return;
    }

    setImageUploadError('');
    setSelectedGeneratedImage(null);
    setUploadedImage({ file, previewUrl: URL.createObjectURL(file) });
  };

  const handleRemoveUploadedImage = () => {
    setUploadedImage(null);
    setImageUploadError('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleConfirmGeneratedImage = () => {
    if (!pendingGeneratedImage) return;
    setUploadedImage(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    setSelectedGeneratedImage(pendingGeneratedImage);
    setPendingGeneratedImage(null);
    setIsImageGeneratorOpen(false);
    if (estimateInputsComplete) {
      void handleCalculatePrice();
    }
  };

  const handleRandomImageRequest = async () => {
    setIsLoadingGeneratedImages(true);
    setImageGenerationMode('random');
    setImageGenerationError('');
    setGeneratedImageSource(null);
    setGeneratedReferenceImages([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/images/random`);
      const result = await response.json() as { images?: unknown; detail?: string };
      if (!response.ok) {
        throw new Error(result.detail || `Image request failed with status ${response.status}.`);
      }
      if (!Array.isArray(result.images) || result.images.length !== 6 || !result.images.every((url) => typeof url === 'string')) {
        throw new Error('The image service did not return six valid image URLs.');
      }
      setGeneratedReferenceImages(result.images);
      setGeneratedImageSource('random');
    } catch (error) {
      setImageGenerationError(error instanceof Error ? error.message : 'Unable to load random tattoo images.');
    } finally {
      setIsLoadingGeneratedImages(false);
      setImageGenerationMode(null);
    }
  };

  const handlePromptImageRequest = async () => {
    const prompt = imagePrompt.trim();
    if (!prompt) {
      await handleRandomImageRequest();
      return;
    }
    if (prompt.length < 3) {
      setImageGenerationError('Enter at least 3 characters for your design description, or leave it blank to browse random designs.');
      return;
    }
    setIsLoadingGeneratedImages(true);
    setImageGenerationMode('prompt');
    setImageGenerationError('');
    setGeneratedReferenceImages([]);
    setGeneratedImageSource(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/images/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const result = await response.json() as { image_url?: string; detail?: string };
      if (!response.ok) {
        throw new Error(result.detail || `Image generation failed with status ${response.status}.`);
      }
      if (typeof result.image_url !== 'string' || !result.image_url.startsWith('https://')) {
        throw new Error('The image service did not return a usable generated image.');
      }
      setGeneratedReferenceImages([result.image_url]);
      setGeneratedImageSource('prompt');
    } catch (error) {
      setImageGenerationError(error instanceof Error ? error.message : 'Unable to generate this tattoo design.');
    } finally {
      setIsLoadingGeneratedImages(false);
      setImageGenerationMode(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('Location access is not available in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationText = `Current location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;
        clearPricePrediction();
        setSelectedLocation(locationText);
        setQuery(locationText);
        setGeoStatus('Using your current location.');
        setShowSuggestions(false);
      },
      () => {
        setGeoStatus('Location permission was denied. You can still type a city or country.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <main className="min-h-screen bg-[#efefef] text-[#1a1a1a]">
      <header className="border-b border-[#d9d9d9] bg-[#f7f7f7]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-[#151515] text-center text-[10px] font-bold leading-7 text-white">I</div>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">InkStudio.ai</span>
          </div>

          <nav className="hidden items-center gap-8 text-[13px] text-[#3b3b3b] md:flex">
            {navItems.map((item) => (
              <a key={item} href="#" className="transition hover:text-black">
                {item}
              </a>
            ))}
          </nav>

          <button className="rounded-md border border-[#d3d3d3] bg-white px-4 py-1.5 text-sm font-medium text-[#1f1f1f] shadow-sm hover:bg-[#fafafa]">
            Log in
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-[1180px] px-6 pb-16 pt-10">
        <div className="mb-7 text-center text-[15px] text-[#4d4d4d]">Plan the budget before the appointment</div>

        <h1 className="text-center text-5xl font-black tracking-[-0.06em] text-[#171717] md:text-[66px]">
          Tattoo Price Calculator
        </h1>

        <p className="mx-auto mt-5 max-w-[760px] text-center text-[18px] leading-[1.55] text-[#5c5c5c]">
          See what your tattoo may cost before booking. Get an instant price range by size,
          style, body placement, color, artist expertise, and design details.
        </p>

        <div className="mt-11 grid items-start gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[22px] border border-[#d7d7d7] bg-[#f2f2f2] p-5 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#111111] px-3 py-3 text-sm font-semibold text-white">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[11px]">✦</span>
              Tattoo details
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666] md:col-span-2">
                <span className="block">City or region</span>

                <div className="relative mt-2">
                  <input
                    value={query}
                    onChange={(event) => {
                      clearPricePrediction();
                      setQuery(event.target.value);
                      setSelectedLocation('');
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => {
                      window.setTimeout(() => setShowSuggestions(false), 150);
                    }}
                    placeholder="Search cities, countries, capitals or regions..."
                    className="w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-[15px] text-[#282828] outline-none transition focus:border-[#999]"
                  />

                  {showSuggestions && (
                    <div className="absolute z-20 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-[#d4d4d4] bg-white shadow-lg">
                      <div className="border-b border-[#efefef] bg-[#f7f7f7] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6a6a6a]">
                        Popular countries & capitals
                      </div>

                      {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <button
                            key={`${option.label}-${option.value}`}
                            type="button"
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectLocation(option.value)}
                            className="flex w-full items-center justify-between border-b border-[#f1f1f1] px-3 py-2.5 text-left text-sm text-[#2a2a2a] last:border-b-0 hover:bg-[#f9f9f9]"
                          >
                            <span>{option.label}</span>
                            <span className="rounded-full bg-[#f0f0f0] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#5f5f5f]">
                              {option.value.includes('Average') ? 'Regional' : 'Location'}
                            </span>
                          </button>
                        ))
                      ) : (
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelectLocation(query.trim())}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-[#2a2a2a] hover:bg-[#f9f9f9]"
                        >
                          <span>Use &ldquo;{query.trim()}&rdquo;</span>
                          <span className="text-[10px] uppercase tracking-[0.12em] text-[#6a6a6a]">Custom</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-2.5 py-2 text-[11px] font-medium text-[#3d3d3d] transition hover:border-[#bdbdbd]"
                  >
                    <span aria-hidden="true">📍</span>
                    Use my location
                  </button>

                  {selectedLocation && (
                    <span className="text-[11px] font-medium text-[#2d2d2d]">Selected: {selectedLocation}</span>
                  )}
                </div>

                {geoStatus && (
                  <p className="mt-2 text-[11px] text-[#5f5f5f]">{geoStatus}</p>
                )}
              </div>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                Artist experience
                <select
                  value={artistExperience}
                  onChange={(event) => {
                    clearPricePrediction();
                    setArtistExperience(event.target.value);
                  }}
                  className="mt-2 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-[15px] text-[#282828] outline-none ring-0 transition focus:border-[#999]"
                >
                  <option value="" disabled>Select experience</option>
                  <option value="starting-out">Starting Out</option>
                  <option value="apprentice">Apprentice</option>
                  <option value="established">Established</option>
                  <option value="experienced">Experienced</option>
                  <option value="popular-artist">Popular Artist</option>
                  <option value="world-class-artist">World-Class Artist</option>
                </select>
              </label>

              <div className="rounded-lg border border-[#dedede] bg-[#f8f8f8] p-3 md:col-span-2">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="text-sm font-semibold text-[#252525]">♧ &nbsp;Mark the intended body area</div>
                    <p className="mt-1 max-w-[440px] text-xs leading-5 text-[#626262]">If placement or size is missing, choose a body template and circle the intended area. No measuring required.</p>
                    {selectedBodyArea && <p className="mt-2 text-xs font-medium text-[#285d49]">Selected: {selectedBodyArea}</p>}
                  </div>
                  <button type="button" onClick={() => setIsBodyAreaOpen(true)} className="shrink-0 rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm font-medium text-[#252525] transition hover:border-[#aaa] hover:bg-[#fbfbfb]">
                    {selectedBodyArea ? 'Change body area' : 'Choose body area'}
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] md:col-span-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Choose an image file"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
                {uploadedImage ? (
                  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-[#d0d0d0] bg-[#f6f6f6] p-3 sm:flex-row sm:items-center">
                    <img
                      src={uploadedImage.previewUrl}
                      alt={`Preview of ${uploadedImage.file.name}`}
                      className="h-20 w-20 rounded-lg border border-[#dedede] bg-white object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#333]">Image added as a tattoo reference</p>
                      <p className="mt-1 truncate text-xs text-[#666]" title={uploadedImage.file.name}>{uploadedImage.file.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-xs font-medium text-[#252525] transition hover:border-[#aaa]"
                      >
                        Change image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveUploadedImage}
                        className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-xs font-medium text-[#555] transition hover:border-[#aaa]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-dashed border-[#d0d0d0] bg-[#f6f6f6] px-4 py-5 text-left text-[#555] transition hover:border-[#999] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777]"
                  >
                    <span aria-hidden="true" className="inline-flex h-5 w-5 items-center justify-center text-base">▧</span>
                    <span className="text-sm font-medium">Upload from an image</span>
                    <span className="ml-auto text-xs text-[#777]">Choose image file</span>
                  </button>
                )}
                {selectedGeneratedImage && (
                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[#d0d0d0] bg-[#f6f6f6] p-3 sm:flex-row sm:items-center">
                    <img
                      src={selectedGeneratedImage}
                      alt="Selected tattoo design"
                      className="h-20 w-20 rounded-lg border border-[#dedede] bg-white object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#333]">Selected tattoo design</p>
                      <p className="mt-1 text-xs text-[#666]">This design will be used as a reference for your estimate.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsImageGeneratorOpen(true);
                        setImageGenerationError('');
                      }}
                      className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-xs font-medium text-[#252525] transition hover:border-[#aaa]"
                    >
                      Change design
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGeneratedImage(null);
                      }}
                      className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-xs font-medium text-[#555] transition hover:border-[#aaa]"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsImageGeneratorOpen(true);
                    setImageGenerationError('');
                  }}
                  className="flex min-h-[76px] w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-[#d0d0d0] bg-white px-5 py-4 text-sm font-medium text-[#252525] transition hover:border-[#999] hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777] md:col-span-2"
                >
                  <span aria-hidden="true">✦</span>
                  <span>Generate image</span>
                </button>
                {imageUploadError && <p role="alert" className="mt-2 text-xs text-red-700">{imageUploadError}</p>}
                {uploadedImage && <p className="mt-2 text-xs text-[#666]">Use the image as a visual reference while completing the tattoo details.</p>}
              </div>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                Tattoo size
                <select
                  value={selectedSize}
                  onChange={(event) => {
                    clearPricePrediction();
                    setSelectedSize(event.target.value);
                  }}
                  className="mt-2 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-[15px] text-[#282828] outline-none ring-0 transition focus:border-[#999]"
                >
                  <option value="" disabled>Select size</option>
                  <option value="tiny">Tiny / 2 x 2 in</option>
                  <option value="small">Small / 3 x 3 in</option>
                  <option value="medium">Medium / 4 x 4 in</option>
                  <option value="large">Large / 5 x 5 in</option>
                  <option value="small-custom">Small custom</option>
                  <option value="medium-custom">Medium custom</option>
                  <option value="large-standalone">Large standalone</option>
                  <option value="half-sleeve">Half sleeve</option>
                  <option value="full-sleeve">Full sleeve</option>
                  <option value="full-back">Full back</option>
                </select>
              </label>

              <div className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                <label htmlFor="placement-search">Body placement</label>
                <div className="relative mt-2">
                  <input
                    id="placement-search"
                    type="search"
                    role="combobox"
                    aria-expanded={showPlacementOptions}
                    aria-controls="placement-options"
                    aria-autocomplete="list"
                    value={showPlacementOptions ? placementSearch : selectedPlacement}
                    onChange={(event) => {
                      clearPricePrediction();
                      setPlacementSearch(event.target.value);
                      setSelectedPlacement('');
                      setShowPlacementOptions(true);
                    }}
                    onFocus={() => {
                      setPlacementSearch('');
                      setShowPlacementOptions(true);
                    }}
                    onBlur={() => window.setTimeout(() => setShowPlacementOptions(false), 150)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setShowPlacementOptions(false);
                      if (event.key === 'Enter' && filteredPlacementSections[0]?.options[0]) {
                        event.preventDefault();
                        clearPricePrediction();
                        setSelectedPlacement(filteredPlacementSections[0].options[0]);
                        setPlacementSearch('');
                        setShowPlacementOptions(false);
                      }
                    }}
                    placeholder="Search placements..."
                    className="w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-[15px] font-normal normal-case tracking-normal text-[#282828] outline-none transition focus:border-[#999]"
                  />

                  {showPlacementOptions && (
                    <div id="placement-options" role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[#dedede] bg-white py-1 shadow-lg">
                      {filteredPlacementSections.length > 0 ? filteredPlacementSections.map((section) => (
                        <div key={section.label}>
                          <div className="px-3 pb-1 pt-2 text-[10px] font-semibold normal-case tracking-normal text-[#707070]">{section.label}</div>
                          {section.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              role="option"
                              aria-selected={selectedPlacement === option}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                clearPricePrediction();
                                setSelectedPlacement(option);
                                setPlacementSearch('');
                                setShowPlacementOptions(false);
                              }}
                              className="block w-full px-3 py-1.5 text-left text-sm font-normal normal-case tracking-normal text-[#252525] hover:bg-[#f3f3f3]"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )) : (
                        <p className="px-3 py-3 text-xs font-normal normal-case tracking-normal text-[#707070]">No placements found.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                <label htmlFor="style-search">Style</label>
                <div className="relative mt-2">
                  <input
                    id="style-search"
                    type="search"
                    role="combobox"
                    aria-expanded={showStyleOptions}
                    aria-controls="style-options"
                    aria-autocomplete="list"
                    value={showStyleOptions ? styleSearch : selectedStyle}
                    onChange={(event) => {
                      clearPricePrediction();
                      setStyleSearch(event.target.value);
                      setSelectedStyle('');
                      setShowStyleOptions(true);
                    }}
                    onFocus={() => {
                      setStyleSearch('');
                      setShowStyleOptions(true);
                    }}
                    onBlur={() => window.setTimeout(() => setShowStyleOptions(false), 150)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setShowStyleOptions(false);
                      if (event.key === 'Enter' && filteredStyleSections[0]?.options[0]) {
                        event.preventDefault();
                        clearPricePrediction();
                        setSelectedStyle(filteredStyleSections[0].options[0]);
                        setStyleSearch('');
                        setShowStyleOptions(false);
                      }
                    }}
                    placeholder="Search tattoo styles..."
                    className="w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-[15px] font-normal normal-case tracking-normal text-[#282828] outline-none transition focus:border-[#999]"
                  />

                  {showStyleOptions && (
                    <div id="style-options" role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[#dedede] bg-white py-1 shadow-lg">
                      {filteredStyleSections.length > 0 ? filteredStyleSections.map((section) => (
                        <div key={section.label}>
                          <div className="px-3 pb-1 pt-2 text-[10px] font-semibold normal-case tracking-normal text-[#707070]">{section.label}</div>
                          {section.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              role="option"
                              aria-selected={selectedStyle === option}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                clearPricePrediction();
                                setSelectedStyle(option);
                                setStyleSearch('');
                                setShowStyleOptions(false);
                              }}
                              className="block w-full px-3 py-1.5 text-left text-sm font-normal normal-case tracking-normal text-[#252525] hover:bg-[#f3f3f3]"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )) : (
                        <p className="px-3 py-3 text-xs font-normal normal-case tracking-normal text-[#707070]">No styles found.</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                Color
                <select
                  value={selectedColor}
                  onChange={(event) => {
                    clearPricePrediction();
                    setSelectedColor(event.target.value);
                  }}
                  className="mt-2 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-3 text-[15px] text-[#282828] outline-none ring-0 transition focus:border-[#999]"
                >
                  <option value="" disabled>Select color</option>
                  <option value="black-and-grey">Black and grey</option>
                  <option value="limited-color">Limited color</option>
                  <option value="full-color">Full color</option>
                </select>
              </label>
            </div>

            <div className="mt-5">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                Design complexity
              </div>
              <div className="grid grid-cols-4 gap-3">
                {complexityOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selectedComplexity === option}
                    onClick={() => {
                      clearPricePrediction();
                      setSelectedComplexity(option);
                    }}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      selectedComplexity === option
                        ? 'border-[#2e2e2e] bg-[#fbfbfb] text-[#1d1d1d] shadow-sm'
                        : 'border-[#d2d2d2] bg-[#f8f8f8] text-[#4d4d4d] hover:border-[#b9b9b9]'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-lg border border-[#d4d4d4] bg-[#f4f4f4]">
              <button
                type="button"
                aria-expanded={showAdvancedOptions}
                aria-controls="advanced-options"
                onClick={() => setShowAdvancedOptions((isOpen) => !isOpen)}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-[#3d3d3d]"
              >
                <span>Advanced options</span>
                <span aria-hidden="true" className="text-lg">{showAdvancedOptions ? '⌃' : '⌄'}</span>
              </button>
              {showAdvancedOptions && (
                <div id="advanced-options" className="border-t border-[#dedede] p-3">
                  <label htmlFor="design-type" className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#666]">
                    Design type
                  </label>
                  <select
                    id="design-type"
                    value={selectedDesignType}
                    onChange={(event) => {
                      clearPricePrediction();
                      setSelectedDesignType(event.target.value);
                    }}
                    className="mt-2 w-full rounded-lg border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-[#282828] outline-none transition focus:border-[#999]"
                  >
                    <option value="Flash design">Flash design</option>
                    <option value="Semi-custom">Semi-custom</option>
                    <option value="Fully custom">Fully custom</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!estimateInputsComplete || isPredictingPrice}
              onClick={handleCalculatePrice}
              className="mt-6 w-full rounded-lg border border-[#d2d2d2] bg-[#ececec] px-4 py-3 text-base font-semibold text-[#1d1d1d] transition hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:bg-[#d8d8d8] disabled:text-[#777]"
            >
              {isPredictingPrice ? 'Predicting price...' : 'Calculate tattoo price'}
            </button>
            {pricePredictionError && <p role="alert" className="mt-2 text-center text-xs text-red-700">{pricePredictionError}</p>}
            {!estimateInputsComplete && (
              <p className="mt-2 text-center text-xs text-[#666]">
                Complete location, artist experience, size, placement, style, and color to calculate.
              </p>
            )}
          </div>

          <aside className="self-start overflow-hidden rounded-xl border border-[#dedede] bg-white shadow-[0_1px_0_rgba(0,0,0,0.02)] lg:sticky lg:top-6">
            <div className="flex items-center gap-2 bg-[#111111] px-6 py-3 text-white">
              <span aria-hidden="true" className="text-base">{getCurrencySymbol(displayCurrencyCode)}</span>
              <h2 className="text-sm font-semibold">Tattoo price estimate</h2>
            </div>

            <div className="p-5">
              {outputDesignImage && (
                <div className="mb-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#555]">Selected design</h3>
                  <img
                    src={outputDesignImage}
                    alt={uploadedImage ? `Uploaded design ${uploadedImage.file.name} used for this price estimate` : 'Selected tattoo design used for this price estimate'}
                    className="mx-auto aspect-square w-full max-w-[240px] rounded-lg border border-[#dedede] bg-[#f7f7f7] object-contain"
                  />
                  {uploadedImage && (
                    <p className="mt-2 truncate text-center text-xs text-[#666]" title={uploadedImage.file.name}>
                      Uploaded: {uploadedImage.file.name}
                    </p>
                  )}
                </div>
              )}
              {datasetPricePrediction ? (
                <div>
                  <p className="text-center text-xs font-medium uppercase tracking-[0.12em] text-[#6b6b6b]">Estimated tattoo price</p>
                  <p className="mt-1 text-center text-3xl font-bold tracking-[-0.04em] text-[#171717]">
                    {formatEstimatePrice(datasetPricePrediction.predicted_price_mid)}
                  </p>
                  <p className="mt-1 text-center text-sm text-[#555]">
                    {formatEstimatePrice(datasetPricePrediction.predicted_price_min)} - {formatEstimatePrice(datasetPricePrediction.predicted_price_max)}
                  </p>

                  <div className="mt-4 border-t border-[#e7e7e7] pt-3">
                    <h3 className="text-xs font-semibold text-[#333]">Included pricing factors</h3>
                    <ul className="mt-2 space-y-1 text-xs leading-4 text-[#666]">
                      {datasetPricePrediction.factors.map((factor) => <li key={factor}>{factor}</li>)}
                    </ul>
                  </div>
                  <p className="mt-4 text-[11px] leading-4 text-[#777]">
                    {currencyCode !== displayCurrencyCode
                      ? exchangeRatesFailed
                        ? `Live ${currencyCode} conversion is unavailable; showing USD instead.`
                        : !areExchangeRatesLoaded
                          ? `Loading ${currencyCode} exchange rates; showing USD temporarily.`
                          : `${currencyCode} rates are unavailable; showing USD instead.`
                      : `Prices shown in ${displayCurrencyCode}. `}
                    The estimate uses the supplied training dataset, is converted from USD when rates are available, and is not a studio quote.
                  </p>
                </div>
              ) : (
                <>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-dashed border-[#dedede] bg-[#fafafa] text-[#555]">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5 stroke-current" strokeWidth="1.7">
                  <rect x="5" y="3" width="14" height="18" rx="2" />
                  <path d="M8 7h8M8 11h2m2 0h1m2 0h1m-8 3h2m2 0h1m2 0h1m-8 3h2m2 0h1m2 0h1" />
                </svg>
              </div>
              <p className="mx-auto mt-4 max-w-[320px] text-center text-sm leading-5 text-[#555]">
                {outputDesignImage
                  ? 'Complete the required details for this selected design, then calculate its tattoo price.'
                  : 'Complete the required details manually or add an image as a visual reference, then calculate your tattoo price.'}
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {[
                  { label: 'Location', complete: Boolean(selectedLocation) },
                  { label: 'Artist level', complete: Boolean(artistExperience) },
                  { label: 'Size and placement', complete: Boolean(selectedSize && selectedPlacement) },
                  { label: 'Design details', complete: Boolean(selectedStyle && selectedComplexity && selectedColor) },
                ].map(({ label, complete }) => (
                  <span
                    key={label}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                      complete ? 'border-[#bdbdbd] bg-[#f5f5f5] text-[#252525]' : 'border-[#e5e5e5] bg-white text-[#333]'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>

              <p className="mt-5 text-center text-xs text-[#555]">Try an example</p>
              <div className="mt-2 space-y-1.5">
                {priceExamples.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => handleApplyPriceExample(example)}
                    className="w-full rounded-md border border-[#dedede] bg-white px-3 py-2.5 text-center text-sm font-medium text-[#222] transition hover:border-[#aaa] hover:bg-[#fafafa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777]"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
      <section aria-labelledby="pricing-guide-heading" className="mx-auto max-w-[1180px] px-6 pb-16">
        <h2 id="pricing-guide-heading" className="mb-6 text-2xl font-bold tracking-[-0.03em] text-[#171717]">
          How tattoo pricing works
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">How we estimate tattoo cost</h3>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              The calculator sends size, city, placement, style, complexity, artist experience, color, and design type to a model trained on the supplied tattoo price dataset.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              Prices are estimated in USD by the model and converted to the selected display currency when exchange rates are available. Dataset-based estimates are planning guidance, not a studio quote.
            </p>
          </article>

          <article className="rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Tattoo cost by size</h3>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              Small tattoos can still hit shop minimums, while sleeves and back pieces usually require multiple sessions.
            </p>
            <GuideTable
              headers={['Size', 'Typical planning range', 'Common use']}
              formatPrice={formatEstimatePrice}
              rows={[
                ['Tiny / 2 x 2 in', '$90-$180', 'Initials, symbols, fine line'],
                ['Small / 3 x 3 in', '$150-$300', 'Simple flash, small icons'],
                ['Medium / 4 x 4 in', '$250-$500', 'Forearm or calf pieces'],
                ['Large / 5 x 5 in', '$380-$760', 'Detailed standalone work'],
                ['Large standalone', '$700-$1,400', 'Custom statement piece'],
                ['Half sleeve', '$1,000-$2,500', 'Multi-session arm work'],
                ['Full sleeve', '$1,800-$5,000', 'Large multi-session project'],
                ['Full back', '$2,500-$7,000', 'Major custom composition'],
              ]}
            />
          </article>

          <article className="rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Cost by placement</h3>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              Forearms and calves are usually more straightforward. Ribs, sternum, neck, hands, and fingers can require more precision or slower work.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              Shape references like square, tall, and wide help estimate designs before the exact body part is final.
            </p>
            <GuideTable
              headers={['Placement', 'Typical effect', 'Why it changes cost']}
              rows={[
                ['Forearm', 'Standard range', 'Easy access and predictable skin'],
                ['Wrist', 'Slightly lower', 'Usually smaller but may hit minimums'],
                ['Hand', 'Higher', 'Visibility, skin texture, and precision'],
                ['Ribs', 'Higher', 'Sensitive area and slower work'],
                ['Sternum', 'Higher', 'Curved, sensitive placement'],
                ['Back', 'Higher', 'Large canvas and layout planning'],
                ['Half sleeve', 'Higher', 'Wraparound composition'],
                ['Full sleeve', 'Highest', 'Large multi-session project'],
              ]}
            />
          </article>

          <article className="rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Cost by style</h3>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              Realism, biomechanical, 3D, Japanese, watercolor, and intricate dotwork usually take longer than simple flash or minimalist linework.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              Artist level affects price because demand, specialization, and custom drawing time all change the quote.
            </p>
            <GuideTable
              headers={['Style', 'Typical effect', 'Why it changes cost']}
              rows={[
                ['Fine Line', 'Lower to standard', 'Small detail work'],
                ['Minimalist', 'Lower', 'Simple linework'],
                ['Traditional', 'Standard', 'Bold readable work'],
                ['Realism', 'Higher', 'Shading and detail'],
                ['Japanese', 'Higher', 'Large composition'],
                ['Watercolor', 'Higher', 'Blending and color work'],
                ['Dotwork', 'Higher', 'Time-intensive texture'],
                ['Biomechanical', 'Premium', 'Complex custom detail'],
              ]}
            />
          </article>

          <article className="rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Cost by artist level</h3>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              Artist level is one of the clearest price signals. A newer artist may be best for simple work, while a world-class specialist can charge several times more for custom pieces.
            </p>
            <GuideTable
              headers={['Artist level', 'Pricing effect', 'Best for']}
              rows={[
                ['Starting Out', 'Lowest planning range', 'Very simple tattoos'],
                ['Apprentice', 'Lower planning range', 'Flash and small pieces'],
                ['Established', 'Typical studio range', 'Most standard tattoos'],
                ['Experienced', 'Specialist pricing', 'Detailed custom work'],
                ['Popular Artist', 'High-demand pricing', 'Signature style pieces'],
                ['World-Class Artist', 'Premium range', 'Collector-level projects'],
              ]}
            />
          </article>

          <article className="rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold">Cost by city / region</h3>
            <p className="mt-3 text-sm leading-6 text-[#555]">
              Major cities often cost more because studio rent, artist demand, and local pricing expectations are higher.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              InkStudio includes a broad city list and falls back to regional averages when an exact city is not available.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#555]">
              Guide-table price ranges and the calculator estimate use the selected location&apos;s currency when exchange rates are available.
            </p>
            <GuideTable
              headers={['City or region', 'Typical effect', 'Planning note']}
              rows={[
                ['United States Average', 'Baseline', 'Default USD reference'],
                ['New York', 'Higher', 'High rent and artist demand'],
                ['San Francisco', 'Highest', 'Premium urban studio pricing'],
                ['Los Angeles', 'Higher', 'Large custom and celebrity market'],
                ['Toronto / Vancouver', 'Higher', 'Major Canadian studio hubs'],
                ['London / Paris', 'Higher', 'Premium European city pricing'],
                ['Tokyo / Singapore', 'Higher', 'Dense specialist markets'],
                ['Other Region', 'Flexible', 'Use when no close city is listed'],
              ]}
            />
          </article>

        </div>

        <div className="mt-6 rounded-lg border border-[#dedede] bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold">Plan the design next</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="#style-search" className="rounded-md border border-[#dedede] px-3 py-2 text-xs font-medium transition hover:bg-[#f5f5f5]">
              Explore tattoo styles
            </a>
            <a href="/plan" className="rounded-md border border-[#dedede] px-3 py-2 text-xs font-medium transition hover:bg-[#f5f5f5]">
              Try tattoo fonts
            </a>
            <a href="/plan" className="rounded-md border border-[#dedede] px-3 py-2 text-xs font-medium transition hover:bg-[#f5f5f5]">
              Preview your tattoo design
            </a>
          </div>
        </div>
      </section>
      {isBodyAreaOpen && (
        <BodyAreaPicker
          onClose={() => setIsBodyAreaOpen(false)}
          onApply={(area) => {
            clearPricePrediction();
            setSelectedBodyArea(area);
            setSelectedPlacement(area);
          }}
        />
      )}
      {isImageGeneratorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsImageGeneratorOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="image-generator-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#dedede] bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-[#e8e8e8] px-5 py-4">
              <div>
                <h2 id="image-generator-title" className="text-lg font-semibold text-[#171717]">Generate tattoo images</h2>
                <p className="mt-1 text-sm text-[#666]">Describe your idea or browse random designs from the reference dataset.</p>
              </div>
              <button
                type="button"
                aria-label="Close image generator"
                onClick={() => setIsImageGeneratorOpen(false)}
                className="rounded-md px-2 py-1 text-xl text-[#555] hover:bg-[#f3f3f3]"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto p-5">
              <label htmlFor="image-design-prompt" className="block text-sm font-medium text-[#333]">Describe the tattoo design</label>
              <textarea
                id="image-design-prompt"
                value={imagePrompt}
                onChange={(event) => {
                  setImagePrompt(event.target.value);
                  setImageGenerationError('');
                }}
                placeholder="e.g. A fine-line floral moon with small stars..."
                rows={3}
                maxLength={500}
                className="mt-2 w-full resize-y rounded-lg border border-[#d4d4d4] bg-white px-3 py-2.5 text-sm text-[#282828] outline-none focus:border-[#999] focus:ring-2 focus:ring-[#e5e5e5]"
              />
              <p className="mt-1 text-xs text-[#777]">
                Free community-powered generation, no API token required. Anonymous requests may take longer or be unavailable when the queue is busy. Don&apos;t include private information in your prompt.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoadingGeneratedImages}
                  onClick={handlePromptImageRequest}
                  className="rounded-md bg-[#171717] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#333] disabled:cursor-wait disabled:opacity-60"
                >
                  {imageGenerationMode === 'prompt' ? 'Generating design...' : 'Generate from prompt'}
                </button>
                <button
                  type="button"
                  disabled={isLoadingGeneratedImages}
                  onClick={handleRandomImageRequest}
                  className="rounded-md border border-[#d4d4d4] bg-white px-4 py-2 text-sm font-medium text-[#252525] transition hover:border-[#999] disabled:cursor-wait disabled:opacity-60"
                >
                  {imageGenerationMode === 'random' ? 'Loading images...' : 'No preference - show 6 random images'}
                </button>
              </div>

              {imageGenerationError && <p role="alert" className="mt-3 text-sm text-red-700">{imageGenerationError}</p>}
              {generatedImageSource === 'prompt' && (
                <p role="status" className="mt-3 text-sm text-[#555]">
                  Generated tattoo concept from AI Horde. Review it with a tattoo artist; it is not a stencil-ready design.
                </p>
              )}

              {generatedReferenceImages.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold text-[#333]">
                    {generatedImageSource === 'prompt' ? 'Your generated tattoo concept' : 'Random tattoo ideas'}
                  </h3>
                  <div className={`mt-3 grid grid-cols-2 gap-3 ${generatedImageSource === 'random' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                    {generatedReferenceImages.map((imageUrl, index) => (
                      <button
                        key={imageUrl}
                        type="button"
                        onClick={() => setPendingGeneratedImage(imageUrl)}
                        className={`overflow-hidden rounded-lg border bg-[#f7f7f7] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#777] ${
                          pendingGeneratedImage === imageUrl ? 'border-[#171717] ring-2 ring-[#777]' : 'border-[#e2e2e2]'
                        }`}
                      >
                        <img src={imageUrl} alt={`${generatedImageSource === 'prompt' ? 'Generated' : 'Random'} tattoo design ${index + 1}`} className="aspect-square w-full object-cover" />
                        <span className="block px-2 py-1.5 text-center text-xs text-[#555]">
                          {pendingGeneratedImage === imageUrl ? 'Selected — confirm below' : `Select design ${index + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {pendingGeneratedImage && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#dedede] bg-[#f8f8f8] p-3">
                  <p className="text-sm text-[#333]">Use this image as your tattoo design?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingGeneratedImage(null)}
                      className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-sm font-medium text-[#333] hover:border-[#aaa]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmGeneratedImage}
                      className="rounded-md bg-[#171717] px-4 py-2 text-sm font-medium text-white hover:bg-[#333]"
                    >
                      OK
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
