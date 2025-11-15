export const uploadCSV = async (csv: File, path: string) => {
    const reader = new FileReader();
    const response = await fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/csv',
        },
        body: csv
      })
    const result = await response.json();
}
