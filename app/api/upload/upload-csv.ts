const uploadCSV = async (file: File) => {
    const response = await fetch('/api/upload/applications', {
        method: 'POST',
        headers: {
            'Content-Type': 'text/csv',
        },
        body: file
    })

    const result = await response.json();
}
