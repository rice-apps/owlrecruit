'use client'

import {uploadCSV} from '../api/upload/upload-csv';
import readCSVAsString from '../api/upload/upload-csv';

export default function ApplicationUpload() {
  const handleFileUploadApplications = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
      const csvStr = await readCSVAsString(file);
      uploadCSV(csvStr, '/api/applications');
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  const handleFileUploadInterviews = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
      const csvStr = await readCSVAsString(file);
      uploadCSV(csvStr, '/api/interviews');
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  return (
    <>
    <input 
      type="file" 
      onChange={handleFileUploadApplications}
      accept=".csv,.txt"
    />
    <h1>The lower one is for interviews</h1>
    <input 
      type="file" 
      onChange={handleFileUploadInterviews}
      accept=".csv,.txt"
    />
    </>
  );
}
