import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import AppShell from "@/components/layout/AppShell";
import PageLoader from "@/components/layout/PageLoader";
import { BookOpen, FileText, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const CATEGORIES = { safety: "Sicurezza", compliance: "Conformità", technical: "Tecnico", leadership: "Leadership", general: "Generale", other: "Altro" };

export default function TrainingPortal() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ certification_name: "", issue_date: "", expiry_date: "", certificate_number: "", issuer: "" });

  useEffect(() => {
    base44.auth.me().then(async (me) => {
      setUser(me);
      const emps = await base44.entities.EmployeeProfile.filter({ user_email: me.email });
      const emp = emps[0];
      setEmployee(emp);

      if (emp) {
        const [allCourses, enrolls, certs] = await Promise.all([
          base44.entities.TrainingCourse.filter({ company_id: emp.company_id, status: "active" }),
          base44.entities.TrainingEnrollment.filter({ employee_id: emp.id }),
          base44.entities.TrainingCertification.filter({ employee_id: emp.id })
        ]);
        setCourses(allCourses);
        setEnrollments(enrolls);
        setCertifications(certs);
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (courseId) => {
    if (!employee) return;
    await base44.entities.TrainingEnrollment.create({
      company_id: employee.company_id,
      course_id: courseId,
      course_title: courses.find(c => c.id === courseId)?.title,
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: user.email,
      enrollment_date: new Date().toISOString(),
      status: "enrolled"
    });
    const updated = await base44.entities.TrainingEnrollment.filter({ employee_id: employee.id });
    setEnrollments(updated);
  };

  const handleUploadCertificate = async (e) => {
    e.preventDefault();
    if (!selectedEnrollment) return;
    
    // Mock upload - in produzione faresti upload del file
    const mockUrl = `data:text/plain,Certificato ${uploadForm.certification_name}`;
    
    await base44.entities.TrainingCertification.create({
      company_id: employee.company_id,
      employee_id: employee.id,
      employee_name: `${employee.first_name} ${employee.last_name}`,
      certification_name: uploadForm.certification_name,
      issue_date: uploadForm.issue_date,
      expiry_date: uploadForm.expiry_date,
      certificate_number: uploadForm.certificate_number,
      issuer: uploadForm.issuer,
      certificate_url: mockUrl,
      uploaded_by: user.email,
      uploaded_at: new Date().toISOString(),
      related_course_id: selectedEnrollment.id
    });

    await base44.entities.TrainingEnrollment.update(selectedEnrollment.id, {
      status: "completed",
      completion_date: new Date().toISOString(),
      completion_percentage: 100
    });

    const [updatedEnrollments, updatedCerts] = await Promise.all([
      base44.entities.TrainingEnrollment.filter({ employee_id: employee.id }),
      base44.entities.TrainingCertification.filter({ employee_id: employee.id })
    ]);
    setEnrollments(updatedEnrollments);
    setCertifications(updatedCerts);
    setShowUpload(false);
    setSelectedEnrollment(null);
    setUploadForm({ certification_name: "", issue_date: "", expiry_date: "", certificate_number: "", issuer: "" });
  };

  if (loading) return <PageLoader color="green" />;

  const enrolledCourseIds = enrollments.map(e => e.course_id);
  const availableCourses = courses.filter(c => !enrolledCourseIds.includes(c.id));
  const completedEnrollments = enrollments.filter(e => e.status === "completed");
  const activeEnrollments = enrollments.filter(e => ["enrolled", "in_progress"].includes(e.status));
  const expiredCerts = certifications.filter(c => c.status === "expired");

  return (
    <AppShell user={user}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Percorso Formativo</h1>
          <p className="text-sm text-slate-500">Gestisci i tuoi corsi e certificazioni</p>
        </div>

        {/* Alerts */}
        {expiredCerts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800">Certificazioni Scadute</p>
              <p className="text-sm text-red-700 mt-1">{expiredCerts.length} certificazione/i richiedono rinnovo urgente</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Corsi Iscritti</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{activeEnrollments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Completati</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{completedEnrollments.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-600 uppercase">Certificazioni</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{certifications.length}</p>
          </div>
        </div>

        {/* Corsi Disponibili */}
        {availableCourses.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-blue-50">
              <h2 className="font-semibold text-slate-800">Corsi Disponibili</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {availableCourses.map(course => (
                <div key={course.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-800">{course.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{CATEGORIES[course.category]}</p>
                    {course.description && <p className="text-sm text-slate-500 mt-1">{course.description}</p>}
                    <div className="flex gap-3 mt-2 text-xs text-slate-500">
                      {course.is_mandatory && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">Obbligatorio</span>}
                      {course.duration_hours && <span>⏱️ {course.duration_hours}h</span>}
                      {course.expiry_months && <span>📅 {course.expiry_months} mesi</span>}
                    </div>
                  </div>
                  <button onClick={() => handleEnroll(course.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex-shrink-0">Iscriviti</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corsi Iscritti */}
        {activeEnrollments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-amber-50">
              <h2 className="font-semibold text-slate-800">Corsi in Corso</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {activeEnrollments.map(enrollment => (
                <div key={enrollment.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-800">{enrollment.course_title}</h3>
                      <p className="text-sm text-slate-600 mt-1">Iscritto il {format(new Date(enrollment.enrollment_date), 'd MMMM yyyy', { locale: it })}</p>
                      {enrollment.completion_percentage > 0 && (
                        <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${enrollment.completion_percentage}%` }} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedEnrollment(enrollment); setShowUpload(true); }}
                      className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 flex-shrink-0"
                    >
                      <Upload className="w-4 h-4" /> Carica Certificato
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Corsi Completati */}
        {completedEnrollments.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-emerald-50">
              <h2 className="font-semibold text-slate-800">Corsi Completati</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {completedEnrollments.map(enrollment => (
                <div key={enrollment.id} className="px-5 py-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-800">{enrollment.course_title}</h3>
                    <p className="text-sm text-slate-600 mt-1">Completato il {format(new Date(enrollment.completion_date), 'd MMMM yyyy', { locale: it })}</p>
                    {enrollment.expiry_date && <p className="text-xs text-slate-500 mt-1">Scade il {format(new Date(enrollment.expiry_date), 'd MMMM yyyy', { locale: it })}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Upload Certificato */}
        {showUpload && selectedEnrollment && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4">
              <h3 className="font-semibold text-slate-800">Carica Certificato</h3>
              <form onSubmit={handleUploadCertificate} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nome Certificazione *</label>
                  <input type="text" required value={uploadForm.certification_name} onChange={e => setUploadForm(f => ({ ...f, certification_name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Ente Emittente</label>
                  <input type="text" value={uploadForm.issuer} onChange={e => setUploadForm(f => ({ ...f, issuer: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data Emissione *</label>
                  <input type="date" required value={uploadForm.issue_date} onChange={e => setUploadForm(f => ({ ...f, issue_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Data Scadenza</label>
                  <input type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm(f => ({ ...f, expiry_date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button type="button" onClick={() => setShowUpload(false)} className="flex-1 px-3 py-2 text-slate-600 border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50">Annulla</button>
                  <button type="submit" className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">Carica</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}