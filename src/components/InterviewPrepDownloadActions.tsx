
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface InterviewPrepDownloadActionsProps {
  interviewData: string;
  jobTitle: string;
  companyName: string;
  contrast?: boolean;
}

const InterviewPrepDownloadActions = ({
  interviewData,
  jobTitle,
  companyName,
  contrast = false,
}: InterviewPrepDownloadActionsProps) => {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(interviewData);
    toast({
      title: "Copied!",
      description: "Interview prep copied to clipboard."
    });
  };

  const handleDownloadPDF = () => {
    if (!interviewData) return;
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Interview Preparation Guide', 20, 20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${jobTitle} at ${companyName}`, 20, 35);
      doc.setFontSize(10);
      
      // Clean the text for PDF
      const cleanText = interviewData
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
        .replace(/^#+\s*/gm, '') // Remove markdown headers
        .replace(/\n{3,}/g, '\n\n'); // Reduce multiple newlines
      
      const splitText = doc.splitTextToSize(cleanText, 170);
      doc.text(splitText, 20, 50);
      doc.save(`Interview_Prep_${companyName}_${jobTitle}.pdf`);
      toast({
        title: "Downloaded!",
        description: "Interview prep downloaded as PDF successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadDOCX = async () => {
    if (!interviewData) return;
    try {
      // Parse the interview data into structured content
      const lines = interviewData.split('\n').filter(line => line.trim());
      const docChildren: Paragraph[] = [];

      // Add title
      docChildren.push(new Paragraph({
        children: [
          new TextRun({
            text: "Interview Preparation Guide",
            bold: true,
            size: 32,
          }),
        ],
      }));

      docChildren.push(new Paragraph({
        children: [
          new TextRun({
            text: `${jobTitle} at ${companyName}`,
            size: 24,
          }),
        ],
      }));

      docChildren.push(new Paragraph({ children: [new TextRun({ text: "" })] })); // Empty line

      // Process each line
      lines.forEach(line => {
        if (line.startsWith('# ')) {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: line.replace('# ', ''),
                bold: true,
                size: 28,
              }),
            ],
          }));
        } else if (line.startsWith('## ')) {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: line.replace('## ', ''),
                bold: true,
                size: 24,
              }),
            ],
          }));
        } else if (line.startsWith('### ')) {
          docChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: line.replace('### ', ''),
                bold: true,
                size: 22,
              }),
            ],
          }));
        } else if (line.includes('**') && line.includes(':**')) {
          // Question or section headers
          const cleanLine = line.replace(/\*\*/g, '');
          docChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: cleanLine,
                bold: true,
                size: 22,
              }),
            ],
          }));
        } else if (line.trim()) {
          // Regular content
          const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1');
          docChildren.push(new Paragraph({
            children: [
              new TextRun({
                text: cleanLine,
                size: 20,
              }),
            ],
          }));
        }
      });

      const doc = new Document({
        sections: [{
          properties: {},
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Interview_Prep_${companyName}_${jobTitle}.docx`);
      toast({
        title: "Downloaded!",
        description: "Interview prep downloaded as DOCX successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download DOCX. Please try again.",
        variant: "destructive",
      });
    }
  };

  const buttonClass = contrast
    ? "bg-white text-black border-2 border-white hover:bg-black hover:text-white hover:border-white"
    : "border bg-white text-black hover:bg-gray-100";

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Button
        onClick={copyToClipboard}
        className={buttonClass + " flex items-center gap-2 px-4 py-2 w-full sm:w-auto"}
        variant={undefined}
        size="sm"
      >
        <Copy className="w-4 h-4" />
        Copy
      </Button>
      <Button
        onClick={handleDownloadPDF}
        className={buttonClass + " flex items-center gap-2 px-4 py-2 w-full sm:w-auto"}
        variant={undefined}
        size="sm"
      >
        <Download className="w-4 h-4" />
        PDF
      </Button>
      <Button
        onClick={handleDownloadDOCX}
        className={buttonClass + " flex items-center gap-2 px-4 py-2 w-full sm:w-auto"}
        variant={undefined}
        size="sm"
      >
        <Download className="w-4 h-4" />
        DOCX
      </Button>
    </div>
  );
};

export default InterviewPrepDownloadActions;
