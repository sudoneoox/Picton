// src/hooks/useStudentSubmissions.ts
import { useEffect, useState } from "react";
import { student } from "@/api/student_dashboard";
import { pretty_log } from "@/api/common_util";

interface FormSubmission {
  id: number;
  form_template_name: string;
  status: string;
  created_at: string;
  pdf_url: string;
}

interface UseStudentSubmissionsResult {
  submissions: FormSubmission[];
  loading: boolean;
  error: string | null;
}

const useStudentSubmissions = (): UseStudentSubmissionsResult => {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data: FormSubmission[] = await student.getSubmissions();
        setSubmissions(data);
      } catch (err: any) {
        pretty_log(`Hook error: ${err.message}`, "ERROR");
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  return { submissions, loading, error };
};

export default useStudentSubmissions;
