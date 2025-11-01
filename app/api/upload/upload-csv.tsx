export const uploadCSV = async (csvStr: string, path: string) => {
    const reader = new FileReader();
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: csvStr
//         body: `org_id,applicant_id,status,notes,created_at,updated_at,position,form_responses
// 006223f5-589e-4886-a3c9-11b90fa99f3c,7aed92ea-4fbb-4d65-b9f1-001a567adcb5,Applied,Lacking SQL experience,2025-10-18 20:42:58.720151+00,2025-10-18 20:42:58.720151+00,New Dev,`
    })

    const result = await response.json();
}
export default function readCSVAsString(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const csvString = event.target?.result as string;
      resolve(csvString);
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}
