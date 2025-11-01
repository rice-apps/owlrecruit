'use client'

import {uploadCSV} from '../api/upload/upload-csv';
import readCSVAsString from '../api/upload/upload-csv';

export default function ApplicationUpload() {
  const handleFileChange = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
      const csvStr = await readCSVAsString(file);
      uploadCSV(csvStr, '/api/upload/applications');
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  return (
    <>
    <input 
      type="file" 
      onChange={handleFileChange}
      accept=".csv,.txt"
    />
    </>
  );
}
