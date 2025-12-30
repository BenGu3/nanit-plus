import { useEffect, useState } from 'react';

export function FormulaCalculator() {
  const [bottles, setBottles] = useState('8');
  const [amountPerBottle, setAmountPerBottle] = useState('');
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [debouncedBottles, setDebouncedBottles] = useState('8');
  const [debouncedAmount, setDebouncedAmount] = useState('');

  // Handle unit change and convert the value
  const handleUnitChange = (newUnit: 'ml' | 'oz') => {
    if (amountPerBottle && unit !== newUnit) {
      const currentValue = Number.parseFloat(amountPerBottle);
      if (!Number.isNaN(currentValue)) {
        if (newUnit === 'oz') {
          // Converting ml to oz
          setAmountPerBottle((currentValue / 29.5735).toFixed(2));
        } else {
          // Converting oz to ml
          setAmountPerBottle((currentValue * 29.5735).toFixed(2));
        }
      }
    }
    setUnit(newUnit);
  };

  // Debounce the inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBottles(bottles);
      setDebouncedAmount(amountPerBottle);
    }, 300);

    return () => clearTimeout(timer);
  }, [bottles, amountPerBottle]);

  // Convert amount per bottle to ml
  const amountPerBottleMl = debouncedAmount
    ? unit === 'oz'
      ? Number.parseFloat(debouncedAmount) * 29.5735
      : Number.parseFloat(debouncedAmount)
    : 0;

  const numBottles = debouncedBottles ? Number.parseFloat(debouncedBottles) : 0;
  const totalNeededMl = numBottles * amountPerBottleMl;

  // Calculate based on ratio: 105ml water + 2 scoops = 120ml formula
  // 1 scoop = 60ml formula
  const scoopsNeeded = totalNeededMl / 60;
  // Round UP to nearest 0.5 scoops
  const scoopsRounded = Math.ceil(scoopsNeeded * 2) / 2;
  const actualFormulaMl = scoopsRounded * 60;
  const leftoverMl = actualFormulaMl - totalNeededMl;
  const waterMl = actualFormulaMl * (105 / 120);

  const mlToOz = (ml: number) => {
    return Number((ml / 29.5735).toFixed(2)).toString();
  };

  const formatNumber = (num: number, decimals: number) => {
    return Number(num.toFixed(decimals)).toString();
  };

  const handlePreset = (presetMl: number) => {
    setUnit('ml');
    setAmountPerBottle(presetMl.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto p-3 md:p-8 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Formula Calculator</h2>

        {/* Preset buttons */}
        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => handlePreset(60)}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
          >
            60ml (2oz)
          </button>
          <button
            type="button"
            onClick={() => handlePreset(80)}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
          >
            80ml (2.7oz)
          </button>
          <button
            type="button"
            onClick={() => handlePreset(90)}
            className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition"
          >
            90ml (3oz)
          </button>
        </div>

        {/* Input section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <div className="mb-4">
            <label htmlFor="num-bottles" className="block text-sm font-medium text-gray-700 mb-2">
              Number of bottles
            </label>
            <input
              id="num-bottles"
              type="number"
              value={bottles}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow integers (no decimals)
                if (value === '' || /^\d+$/.test(value)) {
                  setBottles(value);
                }
              }}
              placeholder="e.g. 8"
              step="1"
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>

          <div>
            <label
              htmlFor="volume-per-bottle"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Volume per bottle
            </label>
            <div className="flex gap-2">
              <input
                id="volume-per-bottle"
                type="number"
                value={amountPerBottle}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow up to 2 decimal places
                  if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                    setAmountPerBottle(value);
                  }
                }}
                placeholder="e.g. 80"
                step="0.01"
                min="0"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              />
              <select
                value={unit}
                onChange={(e) => handleUnitChange(e.target.value as 'ml' | 'oz')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="ml">ml</option>
                <option value="oz">oz</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {debouncedAmount && debouncedBottles && totalNeededMl > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recipe</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Water:</span>
                <span className="text-gray-900 font-semibold">
                  {formatNumber(waterMl, 2)}ml ({mlToOz(waterMl)}oz)
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Scoops:</span>
                <span className="text-gray-900 font-semibold">
                  {formatNumber(scoopsRounded, 1)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-700 font-medium">Makes:</span>
                <span className="text-gray-900 font-semibold">
                  {formatNumber(actualFormulaMl, 2)}ml ({mlToOz(actualFormulaMl)}oz)
                </span>
              </div>
              {leftoverMl > 0 && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700 font-medium">Leftover:</span>
                  <span className="text-amber-600 font-semibold">
                    {formatNumber(leftoverMl, 2)}ml ({mlToOz(leftoverMl)}oz)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
