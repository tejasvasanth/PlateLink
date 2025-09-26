import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// NOTE: Assuming your firebase imports are correctly configured:
import { storage } from '../config/firebase'; 
import AuthService from '../services/AuthService';
import FoodSurplusService, { CreateFoodSurplusData } from '../services/FoodSurplusService';

// 💡 NEW IMPORTS: ML Prediction Service and Types
import { getMLPredictions, SurplusInput, SpoilageInput, PredictionResult } from '../services/MLPredictionService'; 
import { User } from '../models/User';


// =========================================================================
// ML LOOKUP DATA (CRITICAL FOR AUTO-FILLING STATIC FEATURES)
// COMPREHENSIVE DATA SET (78 Unique Dishes from canteen_daily_log.csv)
// =========================================================================
interface DishFeature { dish_name: string; food_id: string; veg_nonveg: string; cuisine: string; is_seasonal_dish: boolean; estimated_prep_time_hours: number; }

const DISH_LOOKUP_BY_ID: { [key: string]: DishFeature } = {
  // --- 78 UNIQUE DISH ENTRIES FROM Canteen Daily Log ---
  "F009": { "dish_name": "Curd Rice", "food_id": "F009", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.95 },
  "F017": { "dish_name": "Prawn Fry", "food_id": "F017", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.62 },
  "F019": { "dish_name": "Chicken Biryani (South Style)", "food_id": "F019", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.50 },
  "F039": { "dish_name": "Keema Matar", "food_id": "F039", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.72 },
  "F026": { "dish_name": "Aloo Gobi", "food_id": "F026", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.31 },
  "F000": { "dish_name": "Plain Rice", "food_id": "F000", "veg_nonveg": "Veg", "cuisine": "Neutral", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.31 },
  "F038": { "dish_name": "Mutton Biryani (North Style)", "food_id": "F038", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.5 },
  "F027": { "dish_name": "Rajma Chawal", "food_id": "F027", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.2 },
  "F031": { "dish_name": "Tandoori Roti (2 pcs)", "food_id": "F031", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.29 },
  "F040": { "dish_name": "Mixed Veg Curry", "food_id": "F040", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.20 },
  "F041": { "dish_name": "Chicken 65", "food_id": "F041", "veg_nonveg": "Non-Veg", "cuisine": "Indo-Chinese", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.40 },
  "F042": { "dish_name": "Chapati (4 pcs)", "food_id": "F042", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.35 },
  "F043": { "dish_name": "Veg Fried Rice", "food_id": "F043", "veg_nonveg": "Veg", "cuisine": "Indo-Chinese", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.80 },
  "F044": { "dish_name": "Pongal", "food_id": "F044", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.00 },
  "F045": { "dish_name": "Fish Curry (Seer)", "food_id": "F045", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.30 },
  "F046": { "dish_name": "Dal Tadka", "food_id": "F046", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.70 },
  "F047": { "dish_name": "Gulab Jamun (2 pcs)", "food_id": "F047", "veg_nonveg": "Veg", "cuisine": "Dessert", "is_seasonal_dish": true, "estimated_prep_time_hours": 0.10 },
  "F048": { "dish_name": "Lemon Rice", "food_id": "F048", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.90 },
  "F049": { "dish_name": "Idli (2 pcs)", "food_id": "F049", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.75 },
  "F050": { "dish_name": "Vada (2 pcs)", "food_id": "F050", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.50 },
  "F051": { "dish_name": "Sambar", "food_id": "F051", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.10 },
  "F052": { "dish_name": "Rasam", "food_id": "F052", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.65 },
  "F053": { "dish_name": "Parotta (2 pcs)", "food_id": "F053", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.45 },
  "F054": { "dish_name": "Chicken Chettinad", "food_id": "F054", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.80 },
  "F055": { "dish_name": "Egg Curry", "food_id": "F055", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.05 },
  "F056": { "dish_name": "Filter Coffee", "food_id": "F056", "veg_nonveg": "Veg", "cuisine": "Beverage", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.15 },
  "F057": { "dish_name": "Vegetable Biryani (South Style)", "food_id": "F057", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.15 },
  "F058": { "dish_name": "Avial", "food_id": "F058", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.40 },
  "F001": { "dish_name": "Masala Dosa", "food_id": "F001", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.15 },
  "F002": { "dish_name": "Poori (3 pcs)", "food_id": "F002", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.85 },
  "F003": { "dish_name": "Chicken Curry", "food_id": "F003", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.65 },
  "F004": { "dish_name": "Upma", "food_id": "F004", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.65 },
  "F005": { "dish_name": "Tomato Rice", "food_id": "F005", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.75 },
  "F006": { "dish_name": "Chole Bhature", "food_id": "F006", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.45 },
  "F007": { "dish_name": "Vangi Bath", "food_id": "F007", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.90 },
  "F008": { "dish_name": "Egg Dosa", "food_id": "F008", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.05 },
  "F010": { "dish_name": "Sambar Rice", "food_id": "F010", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.00 },
  "F011": { "dish_name": "Veg Korma", "food_id": "F011", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.15 },
  "F012": { "dish_name": "Rajma", "food_id": "F012", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.35 },
  "F013": { "dish_name": "Chicken Fry", "food_id": "F013", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.70 },
  "F014": { "dish_name": "Paneer Butter Masala", "food_id": "F014", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.60 },
  "F015": { "dish_name": "Meen Varuval (Fish Fry)", "food_id": "F015", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.85 },
  "F016": { "dish_name": "Meen Kuzhambu (Fish Curry)", "food_id": "F016", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.50 },
  "F018": { "dish_name": "Mutton Sukka", "food_id": "F018", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.25 },
  "F020": { "dish_name": "Chicken Curry (South Style)", "food_id": "F020", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.40 },
  "F021": { "dish_name": "Mushroom Biryani", "food_id": "F021", "veg_nonveg": "Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.05 },
  "F022": { "dish_name": "Palak Paneer", "food_id": "F022", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.55 },
  "F023": { "dish_name": "Gobi Manchurian", "food_id": "F023", "veg_nonveg": "Veg", "cuisine": "Indo-Chinese", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.60 },
  "F024": { "dish_name": "Chicken Manchurian", "food_id": "F024", "veg_nonveg": "Non-Veg", "cuisine": "Indo-Chinese", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.75 },
  "F025": { "dish_name": "Tawa Roti (2 pcs)", "food_id": "F025", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.20 },
  "F028": { "dish_name": "Dal Makhani", "food_id": "F028", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.85 },
  "F029": { "dish_name": "Shahi Paneer", "food_id": "F029", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.70 },
  "F030": { "dish_name": "Mix Vegetable", "food_id": "F030", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.25 },
  "F032": { "dish_name": "Mutton Rogan Josh", "food_id": "F032", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.95 },
  "F033": { "dish_name": "Chana Masala", "food_id": "F033", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.30 },
  "F034": { "dish_name": "Rice Kheer", "food_id": "F034", "veg_nonveg": "Veg", "cuisine": "Dessert", "is_seasonal_dish": true, "estimated_prep_time_hours": 0.40 },
  "F035": { "dish_name": "Chicken Tikka Masala", "food_id": "F035", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.75 },
  "F036": { "dish_name": "Tandoori Chicken (Half)", "food_id": "F036", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.90 },
  "F037": { "dish_name": "Veg Pulav", "food_id": "F037", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 1.05 },
  "F059": { "dish_name": "Chicken Biryani (North Style)", "food_id": "F059", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.45 },
  "F060": { "dish_name": "Fish Fry", "food_id": "F060", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": true, "estimated_prep_time_hours": 0.80 },
  "F061": { "dish_name": "Mutton Biryani (South Style)", "food_id": "F061", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.60 },
  "F062": { "dish_name": "Veg Noodles", "food_id": "F062", "veg_nonveg": "Veg", "cuisine": "Indo-Chinese", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.70 },
  "F063": { "dish_name": "Egg Noodles", "food_id": "F063", "veg_nonveg": "Non-Veg", "cuisine": "Indo-Chinese", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.80 },
  "F064": { "dish_name": "Milk (200ml)", "food_id": "F064", "veg_nonveg": "Veg", "cuisine": "Beverage", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.05 },
  "F065": { "dish_name": "Aam Ras", "food_id": "F065", "veg_nonveg": "Veg", "cuisine": "Dessert", "is_seasonal_dish": true, "estimated_prep_time_hours": 0.15 },
  "F066": { "dish_name": "Tea", "food_id": "F066", "veg_nonveg": "Veg", "cuisine": "Beverage", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.10 },
  "F067": { "dish_name": "Jeera Rice", "food_id": "F067", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.95 },
  "F068": { "dish_name": "Mushroom Curry", "food_id": "F068", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.45 },
  "F069": { "dish_name": "Kofta Curry", "food_id": "F069", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.60 },
  "F070": { "dish_name": "Chicken Do Pyaza", "food_id": "F070", "veg_nonveg": "Non-Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.80 },
  "F071": { "dish_name": "Mutton Pepper Fry", "food_id": "F071", "veg_nonveg": "Non-Veg", "cuisine": "South Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.35 },
  "F072": { "dish_name": "Puri Bhaji", "food_id": "F072", "veg_nonveg": "Veg", "cuisine": "North Indian", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.05 },
  "F073": { "dish_name": "Vegetable Cutlet", "food_id": "F073", "veg_nonveg": "Veg", "cuisine": "Snack", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.35 },
  "F074": { "dish_name": "Samosa (2 pcs)", "food_id": "F074", "veg_nonveg": "Veg", "cuisine": "Snack", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.25 },
  "F075": { "dish_name": "Ice Cream", "food_id": "F075", "veg_nonveg": "Veg", "cuisine": "Dessert", "is_seasonal_dish": true, "estimated_prep_time_hours": 0.05 },
  "F076": { "dish_name": "Mango Lassi", "food_id": "F076", "veg_nonveg": "Veg", "cuisine": "Beverage", "is_seasonal_dish": true, "estimated_prep_time_hours": 0.10 },
  "F077": { "dish_name": "Masala Tea", "food_id": "F077", "veg_nonveg": "Veg", "cuisine": "Beverage", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.12 },
  "F078": { "dish_name": "Chicken Roll", "food_id": "F078", "veg_nonveg": "Non-Veg", "cuisine": "Snack", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.55 },
  "F079": { "dish_name": "Veg Roll", "food_id": "F079", "veg_nonveg": "Veg", "cuisine": "Snack", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.45 },
  "F080": { "dish_name": "Biryani Rice", "food_id": "F080", "veg_nonveg": "Veg", "cuisine": "Neutral", "is_seasonal_dish": false, "estimated_prep_time_hours": 0.60 },

  // Fallback
  "F999": { "dish_name": "Unknown Dish", "food_id": "F999", "veg_nonveg": "Veg", "cuisine": "Neutral", "is_seasonal_dish": false, "estimated_prep_time_hours": 1.0 }
};
const DISH_LIST = Object.values(DISH_LOOKUP_BY_ID).filter(d => d.food_id !== 'F999');

const getDishFeaturesById = (id: string): DishFeature => {
    return DISH_LOOKUP_BY_ID[id.toUpperCase()] || DISH_LOOKUP_BY_ID["F999"];
};

// --- Default Operational Feature Values ---
const DEFAULT_OPERATIONAL_FEATURES = {
    is_holiday: false,
    staff_on_duty: 10,
    peak_hour_demand_ratio: 0.6,
    price_type_special_weather: 'Weather: Clear', 
};


// =========================================================================
// SURPLUS SCREEN COMPONENT
// =========================================================================

const SurplusScreen: React.FC = () => {
  // New state for search suggestions
  const [suggestions, setSuggestions] = useState<DishFeature[]>([]);
  
  // State variables that are the result of a successful selection
  const [foodName, setFoodName] = useState(''); // INITIALIZED TO EMPTY STRING
  const [foodId, setFoodId] = useState(''); // INITIALIZED TO EMPTY STRING
  const [vegNonveg, setVegNonveg] = useState('N/A'); // Changed for display clarity
  const [cuisine, setCuisine] = useState('N/A'); // Changed for display clarity
  const [prepTime, setPrepTime] = useState('0.0'); // Changed for display clarity
  const [isSeasonal, setIsSeasonal] = useState(false); 

  // Manual input/operational states
  const [quantity, setQuantity] = useState(''); // INITIALIZED TO EMPTY STRING
  const [unit] = useState('kg');
  const [category] = useState<'vegetarian' | 'non-vegetarian' | 'vegan' | 'beverages' | 'snacks' | 'desserts'>('non-vegetarian');
  const [pickupLocation, setPickupLocation] = useState('Canteen Main Gate');
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Spoilage Model states
  const [timeSincePrep, setTimeSincePrep] = useState('1.0'); 
  const [storageInfo, setStorageInfo] = useState('Room Temp'); 
  const [predictedData, setPredictedData] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  
  // Removed image-related states: [imageUri, uploading, submitting, etc.]
  const [submitting, setSubmitting] = useState(false);


  // --- NEW: Search/Filter Logic ---
  useEffect(() => {
    // Only show suggestions if the name is partially typed and a Food ID hasn't been set
    if (foodName.length > 2) {
      const filtered = DISH_LIST.filter(dish =>
        dish.dish_name.toLowerCase().includes(foodName.toLowerCase())
      ).slice(0, 5); // Limit to 5 suggestions
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
    setPredictedData(null); // Clear prediction if user starts typing a new food name
  }, [foodName]);


  // --- NEW: Selection Handler ---
  const handleSelectDish = (dish: DishFeature) => {
    setFoodName(dish.dish_name);
    setFoodId(dish.food_id);
    setVegNonveg(dish.veg_nonveg);
    setCuisine(dish.cuisine);
    setPrepTime(String(dish.estimated_prep_time_hours));
    setIsSeasonal(dish.is_seasonal_dish);
    setSuggestions([]); // Hide suggestions after selection
  };
  
  // Removed Image placeholder functions: pickImage and uploadImage


  // --- Function to Call ML APIs ---
  const handleRunPrediction = async () => {
    // 1. INPUT VALIDATION 
    if (!foodName || foodId === 'F999' || !quantity || !timeSincePrep || !storageInfo || !pickupLocation) {
         Alert.alert('Missing Data', 'Please select a valid Food Name (using the search) and fill in all required fields.');
         return;
    }

    setPredicting(true);
    setPredictedData(null); 
    
    const plannedKg = parseFloat(quantity);
    const t_since_prep = parseFloat(timeSincePrep);
    const est_prep_time = parseFloat(prepTime); 
    const now = new Date();

    if (isNaN(plannedKg) || isNaN(t_since_prep) || isNaN(est_prep_time)) {
        Alert.alert('Invalid Input', 'Quantity, Time Since Prep, and Estimated Prep Time must be valid numbers.');
        setPredicting(false);
        return;
    }

    // 2. CONSTRUCT PAYLOADS
    const operationalFeatures = DEFAULT_OPERATIONAL_FEATURES;
    
    const surplusPayload: SurplusInput = {
        ...operationalFeatures,
        day_of_wk: now.toLocaleDateString('en-US', { weekday: 'long' }),
        month: now.getMonth() + 1,
        meal_type: now.getHours() < 14 ? 'Lunch' : 'Dinner', 
        actual_kg_planned: plannedKg,
        
        food_id: foodId, 
        veg_nonveg: vegNonveg,
        cuisine: cuisine,
        estimated_prep_time_hours: est_prep_time,
        is_seasonal_dish: isSeasonal, 
    };

    const spoilagePayload: SpoilageInput = {
        Time_Since_Prep_Hours: t_since_prep,
        Storage_Info: storageInfo,
        Food_Type: foodName, 
        Meal_Time: surplusPayload.meal_type,
    };

    // 3. CALL ML SERVICE
    const result = await getMLPredictions(surplusPayload, spoilagePayload);
    setPredicting(false);

    if (result) {
        setPredictedData(result);
        if (result.predictedSafeHours === 0) {
             Alert.alert('⚠️ FOOD SPOILED', 'The food is past the safety limit (4.0 hours at room temperature) and cannot be listed.');
        } else {
            Alert.alert(
                'ML Forecast Complete',
                `Predicted Waste (Surplus): ${result.predictedSurplusKg.toFixed(2)} ${unit}\nRemaining Safe Time: ${result.predictedSafeHours.toFixed(2)} hours`,
                [{ text: 'OK' }]
            );
        }
    } else {
        Alert.alert('Prediction Failed', 'Could not connect to the ML APIs. Ensure the Python servers are running and the IP address in MLPredictionService.ts is correct.');
    }
  };


  // --- Function to List Surplus (uses ML Prediction) ---
  const handleListSurplus = async () => {
    if (!predictedData) {
        Alert.alert('Prediction Required', 'Please tap "Run ML Forecast" first.');
        return;
    }
    // Safety check for 0 hours remaining
    if (predictedData.predictedSafeHours === 0) {
        Alert.alert('Cannot List', 'Safety lock triggered: Food is past the safe limit.');
        return;
    }

    setSubmitting(true);
    let downloadUrl: string | undefined = undefined; // Since image upload is removed, this defaults to undefined

    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser || currentUser.userType !== 'canteen' || !currentUser.canteenName) {
        throw new Error("User must be a Canteen and logged in.");
      }
      
      if (!foodName || foodId === 'F999' || !quantity || !pickupLocation) {
        throw new Error("Missing required form fields or invalid food selected.");
      }

      // REMOVED: Image upload logic
      
      const predictedExpiryTime = new Date(Date.now() + predictedData.predictedSafeHours * 3600000); 
      
      const finalSurplusData: CreateFoodSurplusData = {
          canteenId: currentUser.id,
          canteenName: currentUser.canteenName,
          foodName: foodName,
          category: category, 
          unit: unit,
          quantity: predictedData.predictedSurplusKg, // **ML-PREDICTED QUANTITY**
          expiryTime: predictedExpiryTime,             // **ML-PREDICTED EXPIRY TIME**
          pickupLocation: pickupLocation,
          additionalInfo: additionalInfo,
          imageUrl: downloadUrl, // Will be undefined
      };

      await FoodSurplusService.getInstance().createFoodSurplus(finalSurplusData);

      Alert.alert('Success', `Food surplus listed! Waste saved: ${predictedData.predictedSurplusKg.toFixed(2)} ${unit}`);
      // Clear form
      setFoodName(''); setFoodId(''); setQuantity(''); setPredictedData(null); 
      setVegNonveg('N/A'); setCuisine('N/A'); setPrepTime('0.0'); // Clear auto-filled info
      setPickupLocation('Canteen Main Gate'); setAdditionalInfo(''); setTimeSincePrep('1.0'); 
      setStorageInfo('Room Temp');

    } catch (error: any) {
      console.error("Listing Surplus failed:", error);
      Alert.alert('Error', error.message || 'Failed to list surplus. Check network and login status.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>List Food Surplus (ML Optimized)</Text>
      
      {/* 1. Dish Name Input (The new search field) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Food Name - *Search & Auto-Fill*</Text>
        <TextInput 
          value={foodName} 
          onChangeText={setFoodName} 
          style={styles.input} 
          placeholder="Start typing the dish name..."
        />
      </View>

      {/* 2. Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map(dish => (
            <TouchableOpacity 
              key={dish.food_id}
              style={styles.suggestionItem}
              onPress={() => handleSelectDish(dish)}
            >
              <Text style={styles.suggestionText}>{dish.dish_name} (ID: {dish.food_id})</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* 3. Planned Quantity Input (ML Input) */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Planned Quantity (kg) - *ML Input*</Text>
        <View style={styles.row}>
          <TextInput 
            value={quantity} 
            onChangeText={setQuantity} 
            keyboardType="numeric" 
            style={[styles.input, { flex: 1, marginRight: 10 }]} 
            placeholder="e.g., 30"
          />
          <View style={styles.unitBox}>
             <Text style={styles.unitText}>{unit}</Text>
          </View>
        </View>
      </View>
      
      {/* 4. Display Auto-Filled Static Features */}
      <Text style={styles.sectionHeader}>Dish Details (Auto-Filled)</Text>
      <View style={styles.detailsBox}>
        <Text style={styles.detailText}>- **Food ID:** {foodId || 'N/A'}</Text>
        <Text style={styles.detailText}>- **Cuisine:** {cuisine}</Text>
        <Text style={styles.detailText}>- **Type:** {vegNonveg}</Text>
        <Text style={styles.detailText}>- **Prep Time:** {prepTime} hours (Historical Avg)</Text>
      </View>

      {/* 5. Spoilage Inputs (The critical manual inputs) */}
      <Text style={styles.sectionHeader}>Food Safety & ML Inputs (Required)</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Time Since Prep (Hours) - *ML Input*</Text>
        <TextInput 
          value={timeSincePrep} 
          onChangeText={setTimeSincePrep} 
          keyboardType="numeric" 
          style={styles.input} 
          placeholder="e.g., 1.0"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Storage Condition - *ML Input*</Text>
        <View style={styles.row}>
            {['Room Temp', 'Refrigerated'].map(info => (
                <TouchableOpacity 
                    key={info}
                    onPress={() => setStorageInfo(info)}
                    style={[
                        styles.storageButton, 
                        storageInfo === info && styles.storageButtonActive
                    ]}
                >
                    <Text style={storageInfo === info ? styles.storageButtonTextActive : styles.storageButtonText}>{info}</Text>
                </TouchableOpacity>
            ))}
        </View>
      </View>
      {/* ------------------------------------------- */}

      {/* Prediction Button */}
      <TouchableOpacity 
        style={[styles.button, styles.predictButton]} 
        onPress={handleRunPrediction} 
        disabled={predicting}
      >
        {predicting ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.buttonText}>Run ML Forecast</Text>
        )}
      </TouchableOpacity>

      {/* ML Prediction Output Box */}
      {predictedData && (
        <View style={[styles.predictionBox, predictedData.predictedSafeHours === 0 && styles.spoiledBox]}>
            <Text style={[styles.predictionText, { fontWeight: 'bold' }]}>
                {predictedData.predictedSafeHours === 0 ? '⚠️ FOOD SPOILED: CANNOT LIST' : '✅ Prediction Complete'}
            </Text>
            <Text style={styles.predictionText}>Predicted Waste (Surplus): **{predictedData.predictedSurplusKg.toFixed(2)} {unit}**</Text>
            <Text style={styles.predictionText}>Remaining Safe Time: **{predictedData.predictedSafeHours.toFixed(2)} hours**</Text>
        </View>
      )}

      {/* Other Required Inputs for FoodSurplusModel */}
      <Text style={styles.sectionHeader}>Donation Details</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pickup Location</Text>
        <TextInput value={pickupLocation} onChangeText={setPickupLocation} style={styles.input} placeholder="e.g., Canteen Main Entrance" />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Additional Info</Text>
        <TextInput value={additionalInfo} onChangeText={setAdditionalInfo} style={styles.input} multiline placeholder="Any special instructions or dietary notes" />
      </View>
      
      {/* List Button */}
      <TouchableOpacity 
        style={[styles.button, styles.listButton, (submitting || !predictedData || predictedData.predictedSafeHours === 0) && styles.disabledButton]} 
        onPress={handleListSurplus} 
        disabled={submitting || !predictedData || predictedData.predictedSafeHours === 0} 
      >
        {submitting ? (
            <ActivityIndicator color="#fff" />
        ) : (
            <Text style={styles.buttonText}>List Surplus for Donation</Text>
        )}
      </TouchableOpacity>
      
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: '#f9f9f9' },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50' },
    sectionHeader: { fontSize: 18, fontWeight: '600', color: '#34495e', marginTop: 20, marginBottom: 10 },
    inputContainer: { marginBottom: 15 },
    label: { fontSize: 14, fontWeight: '600', color: '#34495e', marginBottom: 5 },
    input: { 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 8, 
        paddingHorizontal: 12, 
        paddingVertical: 10, 
        fontSize: 16, 
        backgroundColor: '#fff' 
    },
    // --- NEW STYLES ---
    suggestionsContainer: { 
        position: 'absolute', 
        top: 130, // Position below the Food Name input (adjust based on header/scroll)
        left: 20,
        right: 20,
        zIndex: 100,
        backgroundColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    suggestionText: {
        fontSize: 16,
        color: '#333',
    },
    spoiledBox: { 
        backgroundColor: '#ffe0e0', 
        borderColor: '#ff4444' 
    }, // Red box for spoiled food
    // --- END NEW STYLES ---

    detailsBox: {
        backgroundColor: '#f0f4f7',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        borderLeftWidth: 3,
        borderLeftColor: '#2196F3',
    },
    detailText: { fontSize: 14, color: '#555', lineHeight: 20, },
    row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
    unitBox: { justifyContent: 'center', paddingRight: 5 },
    unitText: { fontSize: 16, color: '#333' },
    
    // ML Specific Styles
    storageButton: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center', backgroundColor: '#fff' },
    storageButtonActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
    storageButtonText: { color: '#333', fontWeight: '500' },
    storageButtonTextActive: { color: '#fff', fontWeight: '500' },

    predictButton: { backgroundColor: '#FF8C00', marginTop: 20 },
    listButton: { backgroundColor: '#4CAF50', marginTop: 20 },
    button: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    disabledButton: { backgroundColor: '#ccc' },
    
    predictionBox: { marginTop: 15, padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#b3d9ff', backgroundColor: '#e6f2ff' },
    predictionText: { fontSize: 14, color: '#34495e', lineHeight: 22, fontWeight: '500' },
    
    // Image Styles (Removed: imageSection, imagePreviewWrapper, imagePreview, imageActionsRow)
});

export default SurplusScreen;
