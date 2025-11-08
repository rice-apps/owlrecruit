"use client"
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,} from "@/components/ui/dialog";
import { Button } from "../../components/ui/button";
import {uploadCSV} from '../api/upload/upload-csv';
import { Upload } from "lucide-react";

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
		<DialogTrigger asChild>
		<Button size="lg">
      <Upload />
			Upload
		</Button>
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
