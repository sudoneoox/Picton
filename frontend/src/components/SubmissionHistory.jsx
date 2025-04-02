import React, { useState, useEffect } from 'react';
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from "@/components/ui/table";
import { useNavigate } from 'react-router-dom';

const SubmissionHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true);
      try {
        const response = await api.studentAPI.getSubmissions();
        setSubmissions(response.submissions);
      } catch (error) {
        pretty_log(`Error fetching submissions: ${error}`, "ERROR");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(sub => 
    statusFilter === 'all' ? true : sub.status === statusFilter
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      returned: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100';
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/submissions/${submissionId}`);
  };

  const Pagination = () => {
    const pageNumbers = Math.ceil(filteredSubmissions.length / itemsPerPage);
    
    return (
      <div className="flex justify-center space-x-2 mt-4">
        {Array.from({ length: pageNumbers }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div>Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">My Submissions</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Submission ID</TableHead>
              <TableHead>Form Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSubmissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.id}</TableCell>
                <TableCell>{submission.form_template.name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded ${getStatusColor(submission.status)}`}>
                    {submission.status}
                  </span>
                </TableCell>
                <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <button 
                    className="text-blue-600 hover:text-blue-800"
                    onClick={() => handleViewSubmission(submission.id)}
                  >
                    View Details
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination />
      </div>
    </div>
  );
};

export default SubmissionHistory;
