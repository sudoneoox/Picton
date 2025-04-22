import React, { useState, useEffect } from 'react';
import { api } from "@/api/api.js";
import { pretty_log } from "@/api/common_util";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ToastNotification";
import SignatureDialog from "@/Pages/dashboard/Common/SignatureDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Download, CheckSquare, Square, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ApprovalQueue = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [comments, setComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSignature, setHasSignature] = useState(true); // Optimistic
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const { showToast } = useToast();
  const [pdfContent, setPdfContent] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [delegatedApprovals, setDelegatedApprovals] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({
    total: 0,
    byFormType: {},
    byUnit: {},
    byPosition: {},
    averageTimeToApproval: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    formType: "all",
    unit: "all",
    position: "all",
  });
  const [formTypes, setFormTypes] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedApprovals, setSelectedApprovals] = useState(new Set());
  const [batchActionDialogOpen, setBatchActionDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState(null); // 'approve' or 'reject'

  useEffect(() => {
    fetchPendingApprovals();
    checkSignature();

    // Fetch users for delegation display
    const fetchUsers = async () => {
      try {
        const response = await api.admin.getUsers();
        setUsers(response?.results || []);
      } catch (error) {
        pretty_log(`Error fetching users: ${error}`, "ERROR");
      }
    };
    fetchUsers();

    const fetchDelegations = async () => {
      try {
        const delegations = await api.staff.getActiveDelegations();
        setDelegatedApprovals(delegations);
      } catch (error) {
        pretty_log(`Error fetching delegations: ${error}`, "ERROR")
      }
    }
    fetchDelegations();
  }, []);

  const checkSignature = async () => {
    try {
      const response = await api.commonAPI.checkIfSignature();
      setHasSignature(response?.has_signature || false);
    } catch (error) {
      pretty_log(`Error checking signature: ${error}`, "ERROR");
      setHasSignature(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.staff.getPendingApprovals();
      setPendingApprovals(response || []);
      updateAnalytics(response || []);
      pretty_log(`Fetched ${response?.length || 0} pending approvals`, "DEBUG");
    } catch (error) {
      pretty_log(`Error fetching pending approvals: ${error}`, "ERROR");
      showToast({ error: "Failed to fetch pending approvals" }, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = async (approval) => {
    setSelectedApproval(approval);
    setIsPdfLoading(true);
    setPdfContent(null);

    try {
      // Fetch the form submission details to get the PDF
      const submission = await api.student.getSubmissionByidentifier(approval.submission_identifier);
      if (submission && submission.pdf_content) {
        setPdfContent(submission.pdf_content);
      } else {
        pretty_log(`No PDF content found for submission ${approval.submission_identifier}`, "WARNING");
      }
    } catch (error) {
      pretty_log(`Error fetching form details: ${error}`, "ERROR");
      showToast({ error: "Failed to load form PDF" }, "error");
    } finally {
      setIsPdfLoading(false);
      setPdfDialogOpen(true);
    }
  };

  const handleApproveClick = (approval) => {
    if (!hasSignature) {
      setShowSignatureDialog(true);
      return;
    }
    setSelectedApproval(approval);
    setComments("");
    setApproveDialogOpen(true);
  };

  const handleRejectClick = (approval) => {
    if (!hasSignature) {
      setShowSignatureDialog(true);
      return;
    }
    setSelectedApproval(approval);
    setComments("");
    setRejectDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    setIsSubmitting(true);
    try {
      await api.staff.approveForm(selectedApproval.id, { comments });
      showToast({ message: "Form approved successfully" }, "success");
      setApproveDialogOpen(false);
      fetchPendingApprovals();
    } catch (error) {
      pretty_log(`Error approving form: ${error}`, "ERROR");
      showToast({ error: error.message || "Failed to approve form" }, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !comments.trim()) {
      showToast({ error: "Comments are required when rejecting a form" }, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.staff.rejectForm(selectedApproval.id, { comments });
      showToast({ message: "Form rejected successfully" }, "success");
      setRejectDialogOpen(false);
      fetchPendingApprovals();
    } catch (error) {
      pretty_log(`Error rejecting form: ${error}`, "ERROR");
      showToast({ error: error.message || "Failed to reject form" }, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignatureSubmit = () => {
    setHasSignature(true);
    setShowSignatureDialog(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDelegatorName = (delegatorId) => {
    if (!delegatorId) return "";
    const user = users.find(u => u.id === delegatorId);
    return user ? `${user.first_name} ${user.last_name}` : delegatorId;
  };

  const updateAnalytics = (approvals) => {
    const stats = {
      total: approvals.length,
      byFormType: {},
      byUnit: {},
      byPosition: {},
      averageTimeToApproval: 0,
    };

    approvals.forEach(approval => {
      const formType = approval.form_title || "Unknown";
      stats.byFormType[formType] = (stats.byFormType[formType] || 0) + 1;

      const unit = approval.unit_name || "Unknown";
      stats.byUnit[unit] = (stats.byUnit[unit] || 0) + 1;

      const position = approval.workflow?.approval_position || approval.unit_role || "Unknown";
      stats.byPosition[position] = (stats.byPosition[position] || 0) + 1;
    });

    setAnalytics(stats);

    setFormTypes([...new Set(approvals.map(a => a.form_title).filter(Boolean))]);
    setPositions([...new Set(approvals.map(a => 
      a.workflow?.approval_position || a.unit_role
    ).filter(Boolean))]);
  };

  const filteredApprovals = pendingApprovals.filter(approval => {
    const searchMatch = 
      (approval.form_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (approval.submitter_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (approval.submission_identifier || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (approval.unit_name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const formTypeMatch = filters.formType === "all" || approval.form_title === filters.formType;
    const unitMatch = filters.unit === "all" || approval.unit_name === filters.unit;
    const positionMatch = filters.position === "all" || 
      (approval.workflow?.approval_position || approval.unit_role) === filters.position;

    return searchMatch && formTypeMatch && unitMatch && positionMatch;
  });

  // Add batch selection functions
  const toggleSelectAll = () => {
    if (selectedApprovals.size === filteredApprovals.length) {
      setSelectedApprovals(new Set());
    } else {
      setSelectedApprovals(new Set(filteredApprovals.map(a => a.id)));
    }
  };

  const toggleSelectApproval = (approvalId) => {
    const newSelected = new Set(selectedApprovals);
    if (newSelected.has(approvalId)) {
      newSelected.delete(approvalId);
    } else {
      newSelected.add(approvalId);
    }
    setSelectedApprovals(newSelected);
  };

  // Add batch action handlers
  const handleBatchAction = async () => {
    if (!selectedApprovals.size || !batchAction) return;

    setIsSubmitting(true);
    try {
      const promises = Array.from(selectedApprovals).map(approvalId => {
        if (batchAction === 'approve') {
          return api.staff.approveForm(approvalId, { comments });
        } else {
          return api.staff.rejectForm(approvalId, { comments });
        }
      });

      await Promise.all(promises);
      showToast({ 
        message: `Successfully ${batchAction}d ${selectedApprovals.size} forms` 
      }, "success");
      setBatchActionDialogOpen(false);
      setSelectedApprovals(new Set());
      fetchPendingApprovals();
    } catch (error) {
      pretty_log(`Error in batch ${batchAction}: ${error}`, "ERROR");
      showToast({ 
        error: `Failed to ${batchAction} some forms. Please try again.` 
      }, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add export function
  const handleExport = () => {
    const exportData = filteredApprovals.map(approval => ({
      'Form Type': approval.form_title || 'Unknown Form',
      'Submitter': approval.submitter_name || 'Unknown',
      'Position': approval.workflow?.approval_position || approval.unit_role || 'Approver',
      'Unit': approval.unit_name || 'N/A',
      'Submission Date': formatDate(approval.created_at),
      'Form ID': approval.submission_identifier || `ID: ${approval.form_submission}`,
      'Status': 'Pending',
    }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).map(value => 
        `"${String(value).replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pending_approvals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Form Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.byFormType).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.byUnit).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.byPosition).length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center flex-1 space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={filters.formType}
            onValueChange={(value) => setFilters({ ...filters, formType: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Form Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {formTypes.map((type) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.position}
            onValueChange={(value) => setFilters({ ...filters, position: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {positions.map((position) => (
                <SelectItem key={position} value={position}>{position}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          {selectedApprovals.size > 0 && (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setBatchAction('approve');
                  setBatchActionDialogOpen(true);
                }}
                disabled={!hasSignature}
              >
                Approve Selected ({selectedApprovals.size})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setBatchAction('reject');
                  setBatchActionDialogOpen(true);
                }}
                disabled={!hasSignature}
              >
                Reject Selected ({selectedApprovals.size})
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredApprovals.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button onClick={fetchPendingApprovals} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {!hasSignature && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-4">
          <h3 className="text-amber-800 font-medium">Signature Required</h3>
          <p className="text-amber-700">
            You need to upload your signature before approving or rejecting forms.
          </p>
          <Button
            onClick={() => setShowSignatureDialog(true)}
            variant="outline"
            className="mt-2"
          >
            Upload Signature
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No pending approvals match your criteria.</p>
        </div>
      ) : (
        <Table>
          <TableCaption>Forms awaiting your approval</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedApprovals.size === filteredApprovals.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Form Type</TableHead>
              <TableHead>Submitter</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Delegation</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Form ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApprovals.map((approval) => (
              <TableRow key={approval.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedApprovals.has(approval.id)}
                    onCheckedChange={() => toggleSelectApproval(approval.id)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center space-x-2">
                    <span>{approval.form_title || "Unknown Form"}</span>
                    {approval.is_urgent && (
                      <AlertCircle className="h-4 w-4 text-red-500" title="Urgent" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{approval.submitter_name || "Unknown"}</TableCell>
                <TableCell>
                  {approval.workflow?.approval_position ? (
                    <Badge variant="outline">{approval.workflow.approval_position}</Badge>
                  ) : (
                    approval.unit_role ? (
                      <span>
                        {approval.unit_role}
                        <span className="text-xs ml-1 text-muted-foreground">({approval.unit_name})</span>
                      </span>
                    ) : "Approver"
                  )}
                </TableCell>                <TableCell>
                  {approval.delegated_by ? (
                    <span className='inline-flex items-center text-xs'>
                      <Badge className='bg-blue-100 text-blue-800 rounded-full px-2 py-1 mr-1'>Delegated</Badge>
                      <span>from {getDelegatorName(approval.delegated_by)}</span>
                    </span>
                  ) : null}
                </TableCell>
                <TableCell>{formatDate(approval.created_at)}</TableCell>
                <TableCell>{approval.submission_identifier || `ID: ${approval.form_submission}`}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewForm(approval)}
                    >
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleApproveClick(approval)}
                      disabled={!hasSignature}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRejectClick(approval)}
                      disabled={!hasSignature}
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[90vw]">
          <DialogHeader>
            <DialogTitle>
              {selectedApproval?.form_title || "Form"} - {selectedApproval?.submission_identifier || `ID: ${selectedApproval?.form_submission}`}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm">Submitter: {selectedApproval?.submitter_name || "Unknown"}</p>
                <p className="text-sm">Submitted: {selectedApproval && formatDate(selectedApproval.created_at)}</p>
                {selectedApproval?.workflow && (
                  <p className="text-sm">Signing as: <Badge variant="outline">{selectedApproval.workflow.approval_position}</Badge></p>
                )}
              </div>
              <div>
                <p className="text-sm">Step: {selectedApproval?.step_number || "N/A"}</p>
                <Badge>Pending Approval</Badge>
              </div>
            </div>

            <div className="h-[70vh] border rounded">
              {isPdfLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p>Loading form PDF...</p>
                </div>
              ) : pdfContent ? (
                <iframe
                  src={`data:application/pdf;base64,${pdfContent}`}
                  className="w-full h-full"
                  title="Form PDF"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <p className="text-gray-500">PDF not available</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="default"
                onClick={() => {
                  setPdfDialogOpen(false);
                  handleApproveClick(selectedApproval);
                }}
                disabled={!hasSignature}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setPdfDialogOpen(false);
                  handleRejectClick(selectedApproval);
                }}
                disabled={!hasSignature}
              >
                Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Form</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              You are approving form {selectedApproval?.submission_identifier || `ID: ${selectedApproval?.form_submission}`}.
            </p>
            {selectedApproval?.workflow && (
              <p className="mb-4 font-medium">
                Signing as: <Badge className="ml-1">{selectedApproval.workflow.approval_position}</Badge>
              </p>
            )}
            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-medium">
                Comments (optional)
              </label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments or notes regarding this approval"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Form</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              You are rejecting form {selectedApproval?.submission_identifier || `ID: ${selectedApproval?.form_submission}`}.
            </p>
            {selectedApproval?.workflow && (
              <p className="mb-4 font-medium">
                Signing as: <Badge className="ml-1">{selectedApproval.workflow.approval_position}</Badge>
              </p>
            )}
            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-medium">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Provide reason for rejection (required)"
                rows={4}
                required
              />
              {!comments.trim() && rejectDialogOpen && (
                <p className="text-sm text-red-500">
                  Comments are required when rejecting a form
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !comments.trim()}
            >
              {isSubmitting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={batchActionDialogOpen} onOpenChange={setBatchActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {batchAction === 'approve' ? 'Approve' : 'Reject'} Multiple Forms
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              You are about to {batchAction} {selectedApprovals.size} forms.
            </p>
            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-medium">
                Comments {batchAction === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <Textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={`Add any comments for the ${batchAction} action${batchAction === 'reject' ? ' (required)' : ''}`}
                rows={4}
                required={batchAction === 'reject'}
              />
              {batchAction === 'reject' && !comments.trim() && (
                <p className="text-sm text-red-500">
                  Comments are required when rejecting forms
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={batchAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleBatchAction}
              disabled={isSubmitting || (batchAction === 'reject' && !comments.trim())}
            >
              {isSubmitting ? `${batchAction}ing...` : `Confirm ${batchAction}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignatureDialog
        isOpen={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        onSignatureSubmit={handleSignatureSubmit}
      />
    </div>
  );
};

export default ApprovalQueue;
