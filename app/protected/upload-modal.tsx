"use client"
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from "@/components/ui/dialog";
import { Button } from "../../components/ui/button";
import {uploadCSV} from '../api/upload/upload-csv';

export default function UploadDialog() {
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
    <Dialog>
		<DialogTrigger className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
                Upload - icon
        </DialogTrigger>
		<DialogContent>
				<DialogTitle>Upload new data</DialogTitle>
				<DialogDescription>Upload new form responses and interview notes here.</DialogDescription>
                <Button asChild size="lg">
      <label htmlFor="interviews-upload" style={{ cursor: 'pointer'}}>
        Upload Interview Feedback
      </label>
    </Button>
    <input 
      type="file"
      id="interviews-upload"
      onChange={handleFileChangeInterview}
      accept=".csv,.txt"
      style={{ display: 'none' }}
    />
    <Button asChild size="lg">
      <label htmlFor="applications-upload" style={{ cursor: 'pointer'}}>
        Upload Applications
      </label>
    </Button>
    <input 
      type="file"
      id="applications-upload"
      onChange={handleFileChangeApplications}
      accept=".csv,.txt"
      style={{ display: 'none' }}
    />
    </DialogContent>
	</Dialog>
)
}
