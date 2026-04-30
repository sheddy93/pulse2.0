"""
Automation Views
================
API endpoints per la gestione delle automazioni.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from users.models import AutomationRule, Task
from users.serializers import AutomationRuleSerializer, TaskSerializer


class AutomationRuleListView(APIView):
    """Lista e gestione regole automazione."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista regole automazione per company."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        rules = AutomationRule.objects.filter(company=company)
        serializer = AutomationRuleSerializer(rules, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crea nuova regola."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        data = request.data.copy()
        data['company'] = company.id

        serializer = AutomationRuleSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class AutomationRuleDetailView(APIView):
    """Dettaglio singola regola automazione."""
    permission_classes = [IsAuthenticated]

    def get(self, request, rule_id):
        """Ottieni dettaglio regola."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        try:
            rule = AutomationRule.objects.get(id=rule_id, company=company)
        except AutomationRule.DoesNotExist:
            return Response({'error': 'Rule not found'}, status=404)

        serializer = AutomationRuleSerializer(rule)
        return Response(serializer.data)

    def put(self, request, rule_id):
        """Aggiorna regola."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        try:
            rule = AutomationRule.objects.get(id=rule_id, company=company)
        except AutomationRule.DoesNotExist:
            return Response({'error': 'Rule not found'}, status=404)

        serializer = AutomationRuleSerializer(rule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, rule_id):
        """Elimina regola."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        try:
            rule = AutomationRule.objects.get(id=rule_id, company=company)
        except AutomationRule.DoesNotExist:
            return Response({'error': 'Rule not found'}, status=404)

        rule.delete()
        return Response(status=204)


class AutomationRuleToggleView(APIView):
    """Attiva/disattiva regola."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, rule_id):
        """Toggle active status."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        try:
            rule = AutomationRule.objects.get(id=rule_id, company=company)
        except AutomationRule.DoesNotExist:
            return Response({'error': 'Rule not found'}, status=404)

        rule.is_active = not rule.is_active
        rule.save()

        return Response({
            'id': rule.id,
            'is_active': rule.is_active,
            'name': rule.name
        })


class TaskListView(APIView):
    """Lista task generati dalle automazioni."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista task per company."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        tasks = Task.objects.filter(company=company)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)


class TaskDetailView(APIView):
    """Gestione singolo task."""
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        """Ottieni dettaglio task."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        try:
            task = Task.objects.get(id=task_id, company=company)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        serializer = TaskSerializer(task)
        return Response(serializer.data)

    def patch(self, request, task_id):
        """Aggiorna task (status, priority, etc)."""
        company = getattr(request.user, 'company', None)
        if not company:
            return Response({'error': 'Company not found'}, status=400)

        try:
            task = Task.objects.get(id=task_id, company=company)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        # Allowed fields for update
        allowed_fields = ['status', 'priority', 'assigned_to', 'due_date']
        update_data = {k: v for k, v in request.data.items() if k in allowed_fields}

        for field, value in update_data.items():
            setattr(task, field, value)

        if update_data.get('status') == Task.StatusChoices.COMPLETED:
            task.completed_at = timezone.now()

        task.save()
        serializer = TaskSerializer(task)
        return Response(serializer.data)