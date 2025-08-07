import React, { useState } from 'react';

const Calculator: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNew, setWaitingForNew] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForNew) {
      setDisplay(num);
      setWaitingForNew(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNew(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      default:
        return secondValue;
    }
  };

  const performCalculation = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForNew(true);
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNew(false);
  };

  const Button: React.FC<{ onClick: () => void; className?: string; children: React.ReactNode }> = ({ 
    onClick, 
    className = '', 
    children 
  }) => (
    <button
      onClick={onClick}
      className={`h-12 rounded-lg font-semibold text-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="h-full bg-gray-100 p-4 flex flex-col">
      {/* Display */}
      <div className="bg-gray-900 text-white text-right text-2xl font-mono p-4 rounded-lg mb-4 overflow-hidden">
        {display}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-4 gap-3 flex-1">
        {/* Row 1 */}
        <Button onClick={clear} className="bg-red-500 hover:bg-red-600 text-white">
          C
        </Button>
        <Button onClick={() => {}} className="bg-gray-300 hover:bg-gray-400 text-gray-700">
          ±
        </Button>
        <Button onClick={() => {}} className="bg-gray-300 hover:bg-gray-400 text-gray-700">
          %
        </Button>
        <Button onClick={() => inputOperation('÷')} className="bg-orange-500 hover:bg-orange-600 text-white">
          ÷
        </Button>

        {/* Row 2 */}
        <Button onClick={() => inputNumber('7')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          7
        </Button>
        <Button onClick={() => inputNumber('8')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          8
        </Button>
        <Button onClick={() => inputNumber('9')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          9
        </Button>
        <Button onClick={() => inputOperation('×')} className="bg-orange-500 hover:bg-orange-600 text-white">
          ×
        </Button>

        {/* Row 3 */}
        <Button onClick={() => inputNumber('4')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          4
        </Button>
        <Button onClick={() => inputNumber('5')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          5
        </Button>
        <Button onClick={() => inputNumber('6')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          6
        </Button>
        <Button onClick={() => inputOperation('-')} className="bg-orange-500 hover:bg-orange-600 text-white">
          −
        </Button>

        {/* Row 4 */}
        <Button onClick={() => inputNumber('1')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          1
        </Button>
        <Button onClick={() => inputNumber('2')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          2
        </Button>
        <Button onClick={() => inputNumber('3')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          3
        </Button>
        <Button onClick={() => inputOperation('+')} className="bg-orange-500 hover:bg-orange-600 text-white">
          +
        </Button>

        {/* Row 5 */}
        <div className="col-span-2">
          <Button onClick={() => inputNumber('0')} className="bg-gray-200 hover:bg-gray-300 text-gray-800 w-full">
            0
          </Button>
        </div>
        <Button onClick={() => inputNumber('.')} className="bg-gray-200 hover:bg-gray-300 text-gray-800">
          .
        </Button>
        <Button onClick={performCalculation} className="bg-orange-500 hover:bg-orange-600 text-white">
          =
        </Button>
      </div>
    </div>
  );
};

export default Calculator;
