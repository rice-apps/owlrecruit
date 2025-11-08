'use client'

import {uploadCSV} from '../api/upload/upload-csv';

export default function ApplicationUpload() {
  const handleFileChangeInterview = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
        uploadCSV(file, "/api/interviews");
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  const handleFileChangeApplications = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
      uploadCSV(file, "/api/interviews");
      } catch (error) {
        console.error("Couldn't read file: ", error);
      }
    }
  };
  return (
    <>
    <input 
      type="file" 
      onChange={handleFileChangeInterview}
      accept=".csv,.txt"
    />
    <h1>The one below is for application upload. The one above is for interview feedback.</h1>
    <input 
      type="file" 
      onChange={handleFileChangeApplications}
      accept=".csv,.txt"
    />
    </>
  );
}
