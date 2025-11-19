import { ProjectView } from '@/components/projects/ProjectView/ProjectView';

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  return <ProjectView projectId={params.id} />;
}

