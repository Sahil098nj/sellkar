import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IndianRupee, Plus, Edit2, Save, X, TrendingUp, AlertCircle, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

interface WarrantyPrice {
  id: string;
  variant_id: string;
  condition_good_deduction_pct: number;
  condition_average_deduction_pct: number;
  condition_below_average_deduction_pct: number;
  device?: {
    model_name: string;
    brand?: {
      name: string;
    };
  };
}

interface EditingState {
  id: string;
  good: string;
  average: string;
  belowAverage: string;
}

export default function AdminPricing() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<EditingState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: warrantyPrices, isLoading, refetch } = useQuery({
    queryKey: ['warranty-prices-with-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warranty_prices')
        .select(`
          id,
          variant_id,
          condition_good_deduction_pct,
          condition_average_deduction_pct,
          condition_below_average_deduction_pct,
          variants(
            device_id,
            storage_gb,
            devices(
              id,
              model_name,
              brands(name)
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
  });

  const handleEditClick = (price: any) => {
    setEditingId(price.id);
    setEditValues({
      id: price.id,
      good: price.condition_good_deduction_pct.toString(),
      average: price.condition_average_deduction_pct.toString(),
      belowAverage: price.condition_below_average_deduction_pct.toString(),
    });
  };

  const handleSave = async () => {
    if (!editValues) return;

    const good = parseFloat(editValues.good);
    const average = parseFloat(editValues.average);
    const belowAverage = parseFloat(editValues.belowAverage);

    if (isNaN(good) || isNaN(average) || isNaN(belowAverage)) {
      toast.error('Please enter valid numbers');
      return;
    }

    if (good < 0 || average < 0 || belowAverage < 0 || good > 100 || average > 100 || belowAverage > 100) {
      toast.error('Percentages must be between 0 and 100');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('warranty_prices')
        .update({
          condition_good_deduction_pct: good,
          condition_average_deduction_pct: average,
          condition_below_average_deduction_pct: belowAverage,
        })
        .eq('id', editValues.id);

      if (error) throw error;

      toast.success('Condition deductions updated successfully');
      setEditingId(null);
      setEditValues(null);
      refetch();
    } catch (err) {
      toast.error('Failed to update pricing');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Pricing Management</h1>
        <p className="text-slate-500 mt-1">Manage condition-based deductions and pricing rules</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pricing Rules</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{warrantyPrices?.length || 0}</div>
                <p className="text-xs text-slate-500">Active device variants</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Condition Types</CardTitle>
            <Percent className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-slate-500">Good, Average, Below-Average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Deductions</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%, 10%, 20%</div>
            <p className="text-xs text-slate-500">For Good, Average, Below-Avg</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Condition-Based Deduction Percentages
          </CardTitle>
          <p className="text-sm text-slate-500 mt-2">
            Manage percentage deductions applied to device prices based on overall condition assessment
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : warrantyPrices && warrantyPrices.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {warrantyPrices.map((price: any) => (
                <div
                  key={price.id}
                  className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {price.variants?.devices?.name} {price.variants?.devices?.model_name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {price.variants?.storage_gb}GB - Variant ID: {price.variant_id.slice(0, 8)}...
                      </p>
                    </div>
                    {editingId !== price.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(price)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>

                  {editingId === price.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg">
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">
                          Good Condition (%)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={editValues?.good}
                          onChange={(e) =>
                            setEditValues({ ...editValues!, good: e.target.value })
                          }
                          className="text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">No scratches, works perfectly</p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">
                          Average Condition (%)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={editValues?.average}
                          onChange={(e) =>
                            setEditValues({ ...editValues!, average: e.target.value })
                          }
                          className="text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">Visible scratches/dents</p>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold mb-2 block">
                          Below-Average Condition (%)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={editValues?.belowAverage}
                          onChange={(e) =>
                            setEditValues({ ...editValues!, belowAverage: e.target.value })
                          }
                          className="text-sm"
                        />
                        <p className="text-xs text-slate-500 mt-1">Major dents & scratches</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600 font-medium">Good Condition</p>
                        <p className="text-xl font-bold text-green-700">
                          {price.condition_good_deduction_pct}%
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600 font-medium">Average Condition</p>
                        <p className="text-xl font-bold text-yellow-700">
                          {price.condition_average_deduction_pct}%
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600 font-medium">Below-Average</p>
                        <p className="text-xl font-bold text-red-700">
                          {price.condition_below_average_deduction_pct}%
                        </p>
                      </div>
                    </div>
                  )}

                  {editingId === price.id && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No pricing rules found</p>
              <p className="text-sm">Device variants and pricing will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">How Condition-Based Deductions Work</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-900 space-y-2">
          <p>
            1. <strong>Percentage Deduction:</strong> Applied to the age-adjusted base price (determined by device age: 0-3 months, 3-6 months, etc.)
          </p>
          <p>
            2. <strong>Accessory Deductions:</strong> Fixed amount deductions for missing charger, box, or bill (applied after percentage deduction)
          </p>
          <p>
            3. <strong>Calculation Order:</strong> Base Price → Apply Age-Based Price → Apply Condition % Deduction → Apply Accessory Amount Deductions
          </p>
          <p>
            4. <strong>Default Values:</strong> Good (0%), Average (10%), Below-Average (20%) - customize per device variant as needed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
