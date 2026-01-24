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
        className="px-10 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition"
      >
        <div>
            <p>Teamwork</p> 
            <input 
                type="number"
                min ="0"
                max ="10"
                value={value1}
                onChange={(e) => setValue1(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="0-10"
            />
            <p> /10</p>
        </div>
        <div>
            <p>Experience</p> 
            <input 
                type="number"
                min ="0"
                max ="10"
                value={value2}
                onChange={(e) => setValue2(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="0-10"
            />
            <p> /10</p>
        </div>
        <div>
            <p>Diversity</p> 
            <input 
                type="number"
                min ="0"
                max ="10"
                value={value3}
                onChange={(e) => setValue3(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="0-10"
            />
            <p> /10</p>
        </div>
        <div>
            <p>Total Score: {Math.round((Number(value1) + Number(value2) + Number(value3))*10)/30} /10</p>
        </div>
            
        </button>
    </>
  );
}

export default BlankModal;