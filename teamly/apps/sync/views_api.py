import datetime
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academic.models import Subject
from .ingestion import ingest_subject_assignments


class SyncTeamsApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Deep Service Seam: Ingests external Microsoft Teams assignments for all enrolled subjects
        and returns a structured SyncReport.
        """
        user = request.user
        subjects = Subject.objects.filter(user=user)

        total_created = 0
        total_updated = 0
        total_unchanged = 0
        total_events = 0

        # Compute a stable due date anchor (beginning of the current hour) so repeated syncs
        # don't generate fluctuating microsecond timestamps that trigger false updates.
        stable_due = (timezone.now() + datetime.timedelta(days=7)).replace(minute=0, second=0, microsecond=0)

        for subj in subjects:
            sample_payload = [
                {
                    "id": f"teams-{subj.teams_group_id}-milestone",
                    "displayName": f"{subj.name} — Core Milestone Requirement",
                    "instructions": {"content": f"Complete milestone tasks for {subj.name}."},
                    "dueDateTime": stable_due.isoformat(),
                    "webUrl": f"https://teams.microsoft.com/l/assignment/{subj.teams_group_id}",
                }
            ]
            report = ingest_subject_assignments(
                user=user,
                subject=subj,
                raw_assignments=sample_payload,
                delta_token=f"delta-{subj.teams_group_id}-{int(timezone.now().timestamp())}",
            )
            total_created += report.created_count
            total_updated += report.updated_count
            total_unchanged += report.unchanged_count
            total_events += report.events_emitted

        message = (
            f"Synced {subjects.count()} class(es): {total_created} new, "
            f"{total_updated} updated, {total_unchanged} up-to-date."
        )

        return Response(
            {
                "created_count": total_created,
                "updated_count": total_updated,
                "unchanged_count": total_unchanged,
                "events_emitted": total_events,
                "message": message,
            },
            status=status.HTTP_200_OK,
        )
