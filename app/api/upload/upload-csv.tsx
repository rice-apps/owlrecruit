export const uploadCSV = async (csv: File, path: string) => {
  await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "text/csv",
    },
    body: csv,
  });
};
