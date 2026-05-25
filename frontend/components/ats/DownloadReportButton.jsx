'use client';

import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download, Loader2 } from 'lucide-react';
import PDFReport from './PDFReport';

export default function DownloadReportButton({ analysis, resume }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !analysis || !resume) {
    // Return a disabled-looking button during SSR or if missing data
    return (
      <button
        disabled
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all opacity-50 cursor-not-allowed"
        style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(34,197,94)' }}
      >
        <Download size={12} /> Download PDF
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<PDFReport analysis={analysis} resume={resume} />}
      fileName={`${resume.originalName.split('.')[0]}_ATS_Report.pdf`}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
      style={{ background: 'rgba(34,197,94,0.12)', color: 'rgb(34,197,94)', textDecoration: 'none' }}
    >
      {({ blob, url, loading, error }) =>
        loading ? (
          <>
            <Loader2 size={12} className="animate-spin" /> Preparing PDF...
          </>
        ) : (
          <>
            <Download size={12} /> Download PDF
          </>
        )
      }
    </PDFDownloadLink>
  );
}
