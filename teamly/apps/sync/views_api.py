from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import get_sync_diagnostics, sync_demo_teams_for_user


class SyncTeamsApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        """
        Deep Service Seam: Ingests external Microsoft Teams assignments for all enrolled subjects
        and returns a structured SyncReport.
        """
        report = sync_demo_teams_for_user(request.user)
        return Response(report, status=status.HTTP_200_OK)


class SyncHistoryApiView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """
        Returns sync diagnostics for the authenticated student:
        subject delta cursors, recent SyncRuns, and chronological AssignmentEvents.
        """
        diagnostics = get_sync_diagnostics(request.user)
        return Response(diagnostics, status=status.HTTP_200_OK)
