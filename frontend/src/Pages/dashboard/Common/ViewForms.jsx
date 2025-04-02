import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pretty_log } from "@/api/common_util";

const ViewForms = ({ submissions }) => {
  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No form submissions found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>{submission.template_name}</span>
              <span className={`px-2 py-1 rounded text-sm ${
                submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                submission.status === 'rejected' ? 'bg-red-100 text-red-800' :
                submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                submission.status === 'returned' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Submitted by: {submission.submitter_name}
              </p>
              <p className="text-sm text-gray-500">
                Submitted on: {new Date(submission.created_at).toLocaleDateString()}
              </p>
              {submission.current_pdf && (
                <a
                  href={submission.current_pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  View PDF
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ViewForms;
