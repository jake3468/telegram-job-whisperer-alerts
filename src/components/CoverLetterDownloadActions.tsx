
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface CoverLetterDownloadActionsProps {
  coverLetter: string;
  jobTitle: string;
  companyName: string;
  contrast?: boolean;
}

const CoverLetterDownloadActions = ({
  coverLetter,
  jobTitle,
  companyName,
  contrast = false,
}: CoverLetterDownloadActionsProps) => {
  const { toast } = useToast();

  const handleDownloadPDF = () => {
    if (!coverLetter) return;
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Cover Letter', 20, 20);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`${jobTitle} at ${companyName}`, 20, 35);
      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(coverLetter, 170);
      doc.text(splitText, 20, 50);
      doc.save(`Cover_Letter_${companyName}_${jobTitle}.pdf`);
      toast({
        title: "Downloaded!",
        description: "Cover letter downloaded as PDF successfully.",
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
    if (!coverLetter) return;
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Cover Letter",
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `${jobTitle} at ${companyName}`,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun({ text: "" })], // Empty line
            }),
            ...coverLetter.split('\n').map(line =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 22,
                  }),
                ],
              })
            ),
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `Cover_Letter_${companyName}_${jobTitle}.docx`);
      toast({
        title: "Downloaded!",
        description: "Cover letter downloaded as DOCX successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download DOCX. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Choose styles depending on contrast prop
  const buttonClass = contrast
    ? "bg-black text-white border-2 border-black hover:bg-white hover:text-black hover:border-black"
    : "border bg-white text-black hover:bg-gray-100";

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
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

export default CoverLetterDownloadActions;
