// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, X, Calendar, Smartphone, Star, AlertCircle, Zap, Package, FileText, CheckCircle, XCircle, Ban } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  basePrice: number;
  deviceName: string;
  releaseDate: string;
  variantId: string;
  brandName?: string;
  onComplete: (
    condition: {
      canMakeCalls: boolean;
      isTouchWorking: boolean;
      isScreenOriginal: boolean;
      isBatteryHealthy: boolean;
      overallCondition: string;
      ageGroup: string;
      hasCharger: boolean;
      hasBox: boolean;
      hasBill: boolean;
    },
    finalPrice: number
  ) => void;
}

const ConditionQuestions = ({ basePrice, deviceName, releaseDate, variantId, brandName, onComplete }: Props) => {
  console.log('🔍 ConditionQuestions Props:', {
    basePrice,
    deviceName,
    releaseDate,
    variantId,
    brandName,
    hasOnComplete: typeof onComplete === 'function'
  });

  const [currentStep, setCurrentStep] = useState<"yesno" | "condition" | "accessories">("yesno");

  // Step 1: Yes/No Questions
  const [canMakeCalls, setCanMakeCalls] = useState<boolean | null>(null);
  const [isTouchWorking, setIsTouchWorking] = useState<boolean | null>(null);
  const [isScreenOriginal, setIsScreenOriginal] = useState<boolean | null>(null);
  const [isBatteryHealthy, setIsBatteryHealthy] = useState<boolean | null>(null);

  // Step 2: Condition & Age
  const [overallCondition, setOverallCondition] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");

  // Step 3: Accessories & Documents
  const [hasOriginalCharger, setHasOriginalCharger] = useState<boolean | null>(null);
  const [hasOriginalBox, setHasOriginalBox] = useState<boolean | null>(null);
  const [hasPurchaseBill, setHasPurchaseBill] = useState<boolean | null>(null);
  const [hasNoneSelected, setHasNoneSelected] = useState<boolean>(false);

  const [finalPrice, setFinalPrice] = useState(0);
  const [basePriceFromAge, setBasePriceFromAge] = useState(0);
  const [warrantyPrices, setWarrantyPrices] = useState<any>(null);
  const [loadingPrices, setLoadingPrices] = useState(false);

  const callsRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const batteryRef = useRef<HTMLDivElement>(null);
  const ageRef = useRef<HTMLDivElement>(null);
  const accessoriesRef = useRef<HTMLDivElement>(null);

  // Check if brand is Apple
  const isAppleBrand = brandName?.toLowerCase().includes('apple') || brandName?.toLowerCase().includes('iphone');

  // Set battery health to true by default for non-Apple devices
  useEffect(() => {
    if (brandName && !isAppleBrand && isBatteryHealthy === null) {
      setIsBatteryHealthy(true);
      console.log('✅ Auto-set battery health to true for non-Apple device:', brandName);
    }
  }, [brandName, isAppleBrand, isBatteryHealthy]);

  // Fetch warranty prices
  useEffect(() => {
    const fetchWarrantyPrices = async () => {
      if (!variantId) {
        console.error('❌ No variantId provided!');
        return;
      }

      console.log('🔍 Fetching warranty prices for variant:', variantId);
      setLoadingPrices(true);
      
      try {
        const { data, error } = await supabase
          .from("warranty_prices")
          .select("*")
          .eq("variant_id", variantId)
          .maybeSingle();

        console.log('📊 Warranty prices result:', { data, error });

        if (error) {
          console.error("❌ Error fetching warranty prices:", error);
        } else if (!data) {
          console.warn('⚠️ No warranty prices found for this variant');
        } else {
          console.log('✅ Warranty prices loaded:', data);
          setWarrantyPrices(data);
        }
      } catch (err) {
        console.error('❌ Exception fetching warranty prices:', err);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchWarrantyPrices();
  }, [variantId]);

  // Update price when age group changes
  useEffect(() => {
    if (ageGroup && warrantyPrices) {
      updatePrice();
    }
  }, [ageGroup, warrantyPrices]);

  // Recalculate price when accessories change
  useEffect(() => {
    if (basePriceFromAge > 0 && warrantyPrices) {
      calculateFinalPriceWithDeductions();
    }
  }, [hasOriginalCharger, hasOriginalBox, hasPurchaseBill, hasNoneSelected, basePriceFromAge, warrantyPrices]);

  // Auto-scroll effects
  useEffect(() => {
    if (canMakeCalls !== null && touchRef.current) {
      setTimeout(() => {
        touchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [canMakeCalls]);

  useEffect(() => {
    if (isTouchWorking !== null && screenRef.current) {
      setTimeout(() => {
        screenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isTouchWorking]);

  useEffect(() => {
    if (isScreenOriginal !== null && batteryRef.current) {
      setTimeout(() => {
        batteryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [isScreenOriginal]);

  useEffect(() => {
    if (overallCondition && ageRef.current && currentStep === "condition") {
      setTimeout(() => {
        ageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [overallCondition, currentStep]);

  useEffect(() => {
    if (currentStep === "accessories" && accessoriesRef.current) {
      setTimeout(() => {
        window.scrollTo({ 
          top: document.documentElement.scrollHeight, 
          behavior: 'smooth' 
        });
      }, 300);
    }
  }, [currentStep]);

  const updatePrice = () => {
    if (!ageGroup || !warrantyPrices) {
      console.warn('⚠️ Cannot update price - missing age group or warranty prices');
      return;
    }

    let price = basePrice;

    switch (ageGroup) {
      case "0-3":
        price = parseFloat(warrantyPrices.price_0_3_months);
        console.log('💰 Price for 0-3 months:', price);
        break;
      case "3-6":
        price = parseFloat(warrantyPrices.price_3_6_months);
        console.log('💰 Price for 3-6 months:', price);
        break;
      case "6-11":
        price = parseFloat(warrantyPrices.price_6_11_months);
        console.log('💰 Price for 6-11 months:', price);
        break;
      case "12+":
        price = parseFloat(warrantyPrices.price_11_plus_months);
        console.log('💰 Price for 12+ months:', price);
        break;
      default:
        price = basePrice;
        console.log('💰 Using base price:', price);
    }

    const roundedPrice = Math.round(price);
    console.log('💰 Base price from age group:', roundedPrice);
    setBasePriceFromAge(roundedPrice);
    setFinalPrice(roundedPrice);
  };

  const calculateFinalPriceWithDeductions = () => {
    if (!warrantyPrices) return;

    let price = basePriceFromAge;
    let totalDeduction = 0;

    // Step 1: Apply condition-based percentage deduction
    let conditionPercentageDeduction = 0;
    if (overallCondition === 'good') {
      conditionPercentageDeduction = parseFloat(warrantyPrices.condition_good_deduction_pct || 0);
    } else if (overallCondition === 'average') {
      conditionPercentageDeduction = parseFloat(warrantyPrices.condition_average_deduction_pct || 0);
    } else if (overallCondition === 'below-average') {
      conditionPercentageDeduction = parseFloat(warrantyPrices.condition_below_average_deduction_pct || 0);
    }

    if (conditionPercentageDeduction > 0) {
      const conditionAmountDeduction = (price * conditionPercentageDeduction) / 100;
      price = price - conditionAmountDeduction;
      console.log(`📉 Condition "${overallCondition}": -${conditionPercentageDeduction}% (-₹${Math.round(conditionAmountDeduction)})`);
      totalDeduction += conditionAmountDeduction;
    }

    // Step 2: Apply accessory-based fixed amount deductions
    const chargerDeduction = parseFloat(warrantyPrices.charger_deduction_amount || 0);
    const boxDeduction = parseFloat(warrantyPrices.box_deduction_amount || 0);
    const billDeduction = parseFloat(warrantyPrices.bill_deduction_amount || 0);

    // If "None" is selected, deduct ALL amounts
    if (hasNoneSelected) {
      totalDeduction += chargerDeduction + boxDeduction + billDeduction;
      console.log(`📉 No accessories: -₹${chargerDeduction + boxDeduction + billDeduction} (all deductions applied)`);
    } else {
      // Apply individual deductions
      if (hasOriginalCharger === false) {
        totalDeduction += chargerDeduction;
        console.log(`📉 No charger: -₹${chargerDeduction}`);
      }
      if (hasOriginalBox === false) {
        totalDeduction += boxDeduction;
        console.log(`📉 No box: -₹${boxDeduction}`);
      }
      if (hasPurchaseBill === false) {
        totalDeduction += billDeduction;
        console.log(`📉 No bill: -₹${billDeduction}`);
      }
    }

    // Apply accessory deductions to the price
    if (chargerDeduction > 0 || boxDeduction > 0 || billDeduction > 0) {
      let accessoryDeduction = 0;
      if (hasNoneSelected) {
        accessoryDeduction = chargerDeduction + boxDeduction + billDeduction;
      } else {
        if (hasOriginalCharger === false) accessoryDeduction += chargerDeduction;
        if (hasOriginalBox === false) accessoryDeduction += boxDeduction;
        if (hasPurchaseBill === false) accessoryDeduction += billDeduction;
      }
      price = price - accessoryDeduction;
    }

    const roundedPrice = Math.round(price);
    console.log('💰 Final price after all deductions:', roundedPrice, `(Total deduction: ₹${Math.round(totalDeduction)})`);
    setFinalPrice(roundedPrice);
  };

  const handleNextToCondition = () => {
    // Check if all required questions are answered
    if (canMakeCalls === null || isTouchWorking === null || isScreenOriginal === null) {
      alert("Please answer all device condition questions");
      return;
    }
    
    // Only validate battery health for Apple devices
    if (isAppleBrand && isBatteryHealthy === null) {
      alert("Please answer all device condition questions");
      return;
    }
    
    setCurrentStep("condition");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextToAccessories = () => {
    if (!overallCondition) {
      alert("Please select the overall condition of your device");
      return;
    }
    
    if (!ageGroup) {
      alert("Please select when you purchased your device");
      return;
    }

    if (!finalPrice || finalPrice === 0) {
      alert("Price calculation error. Please refresh and try again.");
      return;
    }

    setCurrentStep("accessories");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleComplete = () => {
    // If "None" is selected, all accessories are false
    const finalCharger = hasNoneSelected ? false : (hasOriginalCharger !== null ? hasOriginalCharger : false);
    const finalBox = hasNoneSelected ? false : (hasOriginalBox !== null ? hasOriginalBox : false);
    const finalBill = hasNoneSelected ? false : (hasPurchaseBill !== null ? hasPurchaseBill : false);

    console.log('✅ Completing with:', {
      canMakeCalls,
      isTouchWorking,
      isScreenOriginal,
      isBatteryHealthy,
      overallCondition,
      ageGroup,
      hasCharger: finalCharger,
      hasBox: finalBox,
      hasBill: finalBill,
      hasNoneSelected,
      basePriceFromAge,
      finalPrice
    });

    onComplete(
      {
        canMakeCalls,
        isTouchWorking,
        isScreenOriginal,
        isBatteryHealthy,
        overallCondition,
        ageGroup,
        hasCharger: finalCharger,
        hasBox: finalBox,
        hasBill: finalBill,
      },
      finalPrice
    );
  };

  const handleAnswer = (value: boolean, setter: (val: boolean) => void) => {
    setter(value);
  };

  const handleConditionSelect = (value: string) => {
    setOverallCondition(value);
    setTimeout(() => {
      ageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  };

  const handleAccessoryToggle = (key: 'charger' | 'box' | 'bill') => {
    // Unselect "None" option when individual items are selected
    setHasNoneSelected(false);
    
    if (key === 'charger') setHasOriginalCharger(prev => prev === true ? null : true);
    if (key === 'box') setHasOriginalBox(prev => prev === true ? null : true);
    if (key === 'bill') setHasPurchaseBill(prev => prev === true ? null : true);
  };

  const handleNoneToggle = () => {
    const newNoneState = !hasNoneSelected;
    setHasNoneSelected(newNoneState);
    
    // If "None" is selected, clear all individual selections
    if (newNoneState) {
      setHasOriginalCharger(null);
      setHasOriginalBox(null);
      setHasPurchaseBill(null);
    }
  };

  const getStepTitle = () => {
    if (currentStep === "yesno") {
      return (
        <>
          Tell us more about your <span style={{ color: "#4169E1" }}>{deviceName}</span>
        </>
      );
    }
    if (currentStep === "condition") return "Device Condition & Age";
    return "Do you have the following accessories?";
  };

  const getStepDescription = () => {
    if (currentStep === "yesno") return "Please answer a few questions about your device.";
    if (currentStep === "condition") return "Please provide device condition and age information.";
    return "Select the accessories you have.";
  };

  if (!variantId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Missing Variant Information</h2>
        <p className="text-muted-foreground">Please go back and select a device variant (storage option)</p>
      </div>
    );
  };

  // Define questions array with conditional battery question
  const questions = [
    { 
      question: "Are you able to make and receive calls?", 
      description: "Check your device for cellular network connectivity issues.",
      value: canMakeCalls,
      setter: setCanMakeCalls,
      ref: callsRef
    },
    { 
      question: "Is your device's touch screen working properly?", 
      description: "Check the touch screen functionality of your phone.",
      value: isTouchWorking,
      setter: setIsTouchWorking,
      ref: touchRef
    },
    { 
      question: "Is your phone's screen original?", 
      description: "Pick 'Yes' if screen was never changed or was changed by Authorized Service Center. Pick 'No' if screen was changed at local shop.",
      value: isScreenOriginal,
      setter: setIsScreenOriginal,
      ref: screenRef
    },
    // Only show battery question for Apple devices
    ...(isAppleBrand ? [{ 
      question: "Battery Health above 80%", 
      description: "Check if your device's battery health is above 80%.",
      value: isBatteryHealthy,
      setter: setIsBatteryHealthy,
      ref: batteryRef
    }] : [])
  ];

  const conditionOptions = [
    { value: "good", label: "Good", description: "No scratch, No dent, Works perfectly" },
    { value: "average", label: "Average", description: "Visible scratches or dents but fully functional" },
    { value: "below-average", label: "Below Average", description: "Major Dents & Major Scratches" }
  ];

  const ageOptions = [
    { value: "0-3", label: "0-3 Months", description: "No Physical Damage" },
    { value: "3-6", label: "3-6 Months", description: "No Physical Damage" },
    { value: "6-11", label: "6-11 Months", description: "No Physical Damage" },
    { value: "12+", label: "11+ Months", description: "Out Of Warranty" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'black' }}>
            {getStepTitle()}
          </h1>
          <p className="text-lg" style={{ color: 'black' }}>
            {getStepDescription()}
          </p>
        </div>

        {/* Step 1: Yes/No Questions */}
        {currentStep === "yesno" && (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card 
                key={index} 
                className="p-6"
                ref={question.ref}
              >
                <div className="space-y-6 text-center">
                  <h2 className="text-2xl font-bold" style={{ color: 'black' }}>{question.question}</h2>
                  <p className="text-lg" style={{ color: 'black' }}>{question.description}</p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => handleAnswer(true, question.setter)}
                      className={`px-8 py-4 flex items-center gap-2 ${question.value !== true ? "opacity-50 hover:opacity-100" : ""}`}
                      style={{ backgroundColor: 'royalBlue', color: 'white' }}
                    >
                      <CheckCircle size={20} /> Yes
                    </Button>
                    <Button
                      onClick={() => handleAnswer(false, question.setter)}
                      variant="outline"
                      className={`px-8 py-4 flex items-center gap-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground ${question.value === false ? "bg-destructive text-destructive-foreground" : ""}`}
                    >
                      <XCircle size={20} /> No
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Step 2: Condition and Age */}
        {currentStep === "condition" && (
          <div className="space-y-6">
            {/* Phone Condition */}
            <Card className="p-6">
              <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold" style={{ color: 'black' }}>What is the overall condition of your phone?</h2>
                <div className="space-y-3">
                  {conditionOptions.map(option => (
                    <Button
                      key={option.value}
                      onClick={() => handleConditionSelect(option.value)}
                      className={`w-full px-6 py-4 text-left justify-start h-auto transition-all duration-200 ${overallCondition !== option.value ? "bg-muted/30 hover:bg-muted" : ""}`}
                      style={{
                        backgroundColor: overallCondition === option.value ? 'royalBlue' : '',
                        color: overallCondition === option.value ? 'white' : 'black'
                      }}
                    >
                      <div>
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm opacity-75">{option.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* Phone Age */}
            <Card className="p-6" ref={ageRef}>
              <div className="space-y-6 text-center">
                <h2 className="text-2xl font-bold" style={{ color: 'black' }}>How old is your phone?</h2>
                <div className="space-y-3">
                  {ageOptions.map(option => (
                    <Button
                      key={option.value}
                      onClick={() => setAgeGroup(option.value)}
                      className={`w-full px-6 py-4 text-left justify-start h-auto transition-all duration-200 ${ageGroup !== option.value ? "bg-muted/30 hover:bg-muted" : ""}`}
                      style={{
                        backgroundColor: ageGroup === option.value ? 'royalBlue' : '',
                        color: ageGroup === option.value ? 'white' : 'black'
                      }}
                    >
                      <div>
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm opacity-75">{option.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Accessories */}
        {currentStep === "accessories" && (
          <div ref={accessoriesRef}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Charger Card */}
              <Card
                onClick={() => handleAccessoryToggle('charger')}
                className={`p-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 relative h-full ${hasOriginalCharger !== true ? "bg-muted/30 hover:bg-muted" : ""}`}
                style={{ backgroundColor: hasOriginalCharger === true ? 'royalBlue' : '', color: hasOriginalCharger === true ? 'white' : 'black' }}
              >
                <img src="/assets/charger.jpg" alt="Charger" className="w-16 h-16 object-contain" />
                <span className="font-semibold">Original Charger of Device</span>
                {hasOriginalCharger === true && <CheckCircle size={20} className="absolute top-2 right-2" />}
              </Card>

              {/* Box Card */}
              <Card
                onClick={() => handleAccessoryToggle('box')}
                className={`p-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 relative h-full ${hasOriginalBox !== true ? "bg-muted/30 hover:bg-muted" : ""}`}
                style={{ backgroundColor: hasOriginalBox === true ? 'royalBlue' : '', color: hasOriginalBox === true ? 'white' : 'black' }}
              >
                <img src="/assets/box.jpg" alt="Box" className="w-16 h-16 object-contain" />
                <span className="font-semibold">Original Box with same IMEI</span>
                {hasOriginalBox === true && <CheckCircle size={20} className="absolute top-2 right-2" />}
              </Card>
              
              {/* Bill Card */}
              <Card
                onClick={() => handleAccessoryToggle('bill')}
                className={`p-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 relative h-full ${hasPurchaseBill !== true ? "bg-muted/30 hover:bg-muted" : ""}`}
                style={{ backgroundColor: hasPurchaseBill === true ? 'royalBlue' : '', color: hasPurchaseBill === true ? 'white' : 'black' }}
              >
                <img src="/assets/bill.jpg" alt="Bill" className="w-16 h-16 object-contain" />
                <span className="font-semibold">Bill of the device is available</span>
                {hasPurchaseBill === true && <CheckCircle size={20} className="absolute top-2 right-2" />}
              </Card>

              {/* None of the Above Card */}
              <Card
                onClick={handleNoneToggle}
                className={`p-4 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-200 relative h-full ${!hasNoneSelected ? "bg-muted/30 hover:bg-muted" : ""}`}
                style={{ backgroundColor: hasNoneSelected ? 'royalBlue' : '', color: hasNoneSelected ? 'white' : 'black' }}
              >
                <img src="/assets/none.jpg" alt="None" className="w-16 h-16 object-contain" />
                <span className="font-semibold">I don't have any of the following</span>
                {hasNoneSelected && <CheckCircle size={20} className="absolute top-2 right-2" />}
              </Card>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 text-center flex flex-col sm:flex-row gap-4 justify-center">
          {currentStep !== "yesno" && (
            <Button
              onClick={() => setCurrentStep(currentStep === "condition" ? "yesno" : "condition")}
              variant="outline"
              className="w-full sm:w-auto px-12 py-4 text-lg"
            >
              Back
            </Button>
          )}
          
          {currentStep === "yesno" && (
            <Button
              onClick={handleNextToCondition}
              className="w-full sm:w-auto px-12 py-4 text-lg"
              style={{ backgroundColor: 'royalBlue', color: 'white' }}
              disabled={questions.some(q => q.value === null)}
            >
              Next
            </Button>
          )}
          
          {currentStep === "condition" && (
            <Button
              onClick={handleNextToAccessories}
              className="w-full sm:w-auto px-12 py-4 text-lg"
              style={{ backgroundColor: 'royalBlue', color: 'white' }}
              disabled={!overallCondition || !ageGroup}
            >
              Next
            </Button>
          )}
          
          {currentStep === "accessories" && (
            <Button
              onClick={handleComplete}
              className="w-full sm:w-auto px-12 py-4 text-lg"
              style={{ backgroundColor: 'royalBlue', color: 'white' }}
            >
              Continue to Verification
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConditionQuestions;