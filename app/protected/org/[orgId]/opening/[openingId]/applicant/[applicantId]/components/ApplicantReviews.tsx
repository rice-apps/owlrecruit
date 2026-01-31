import React, { useState } from 'react';

export function BlankModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [value1, setValue1] = useState<number | string>('');
  const [value2, setValue2] = useState<number | string>('');
  const [value3, setValue3] = useState<number | string>('');
 
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-10 py-6 border border-black-600 bg-white-600 text-black rounded-lg transition"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-500 text-sm">Skills</p>
            <p className="text-gray-500 text-sm">Your Score</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-lg">Teamwork</p> 
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={value1}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === "") {
                      setValue1("");
                    } else {
                      const numVal = Number(val);
                      setValue1(Math.max(0, Math.min(10, numVal)));
                    }
                  }}
                  className="w-20 border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="0-10"
                />
                <p>/ 10</p>
              </div> 
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-lg">Experience</p> 
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={value2}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === "") {
                      setValue2("");
                    } else {
                      const numVal = Number(val);
                      setValue2(Math.max(0, Math.min(10, numVal)));
                    }
                  }}
                  className="w-20 border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="0-10"
                />
                <p>/ 10</p>
              </div> 
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-lg">Diversity</p> 
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={value3}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = e.target.value;
                    if (val === "") {
                      setValue3("");
                    } else {
                      const numVal = Number(val);
                      setValue3(Math.max(0, Math.min(10, numVal)));
                    }
                  }}
                  className="w-20 border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="0-10"
                />
                <p>/ 10</p>
              </div> 
            </div>
          </div>

          <div className="border-t border-gray-300"></div>
          
          <div className="flex items-center justify-between">
            <p className="text-lg font-medium">Total Score:</p>
            <div className="flex items-center gap-2">
              <p className="w-20 px-2">
                {Math.round((Number(value1) + Number(value2) + Number(value3))/30 * 100)/10}
              </p>
              <p>/ 10</p>
            </div>
          </div>
        </div>
      </button>
    </>
  );
}

export default BlankModal;