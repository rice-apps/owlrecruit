export const uploadCSV = async (csvStr: string, path: string) => {
    const reader = new FileReader();
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
        },
        body: csvStr
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
