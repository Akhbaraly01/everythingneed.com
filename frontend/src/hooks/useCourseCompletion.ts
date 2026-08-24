import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateCertificatePDF } from "@/utils/certificateGenerator";
import type { VideoProgress } from "@core/api/types";

export const useCourseCompletion = (courseId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if all lessons are completed
  const { data: completionData, isLoading } = useQuery({
    queryKey: ['course-completion', courseId, user?.id],
    queryFn: async () => {
      if (!user) return { totalLessons: 0, completedLessons: 0, isComplete: false };

      const progress = (await db
        .from('video_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)) as VideoProgress[];

      const completedLessons = progress.filter((p) => p.completed).length || 0;
      const totalLessons = 10; // Default for sample courses

      return {
        totalLessons,
        completedLessons,
        isComplete: completedLessons >= totalLessons,
        progress,
      };
    },
    enabled: !!user && !!courseId,
  });

  // Check if certificate already exists
  const { data: existingCertificate } = useQuery({
    queryKey: ['certificate', courseId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      return db
        .from('user_certificates')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
    },
    enabled: !!user && !!courseId,
  });

  // Complete course and generate certificate
  const completeCourse = useMutation({
    mutationFn: async (courseData: { title: string; instructor: string }) => {
      if (!user) throw new Error("Not authenticated");

      // Update enrollment as completed
      const enrollment = await db
        .from('enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (enrollment) {
        await db
          .from('enrollments')
          .update({
            progress: 100,
            completed_at: new Date().toISOString(),
          })
          .eq('id', enrollment.id);
      }

      // Create certificate if not exists
      if (!existingCertificate) {
        return db
          .from('user_certificates')
          .insert({
            user_id: user.id,
            course_id: courseId,
            course_title: courseData.title,
            instructor_name: courseData.instructor,
            certificate_number: `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          })
          .select()
          .single();
      }

      return existingCertificate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['course-completion'] });
      queryClient.invalidateQueries({ queryKey: ['certificate'] });
      queryClient.invalidateQueries({ queryKey: ['user-certificates'] });
      toast.success("Congratulations! Course completed! 🎉");
    },
    onError: (error) => {
      toast.error("Failed to complete course: " + error.message);
    },
  });

  // Download certificate
  const downloadCertificate = async (certificate: any, studentName: string) => {
    try {
      generateCertificatePDF({
        studentName,
        courseTitle: certificate.course_title,
        instructorName: certificate.instructor_name,
        issueDate: new Date(certificate.issued_at),
        certificateNumber: certificate.certificate_number,
      });
      toast.success("Certificate downloaded!");
    } catch (error) {
      toast.error("Failed to download certificate");
    }
  };

  // Mark lesson as complete
  const markLessonComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) throw new Error("Not authenticated");

      return db
        .from('video_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          progress_percent: 100,
          completed: true,
          last_position_seconds: 0,
        })
        .select()
        .single();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-completion'] });
      queryClient.invalidateQueries({ queryKey: ['video-progress'] });
    },
  });

  return {
    completionData,
    isLoading,
    existingCertificate,
    completeCourse: completeCourse.mutate,
    isCompleting: completeCourse.isPending,
    downloadCertificate,
    markLessonComplete: markLessonComplete.mutate,
  };
};
