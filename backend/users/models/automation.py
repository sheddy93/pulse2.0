"""
AutomationRule, Task, and related models.
"""

from django.db import models

from ._base import BaseModel, TimestampedModel
from ._choices import (
    AutomationActionTypeChoices,
    AutomationTriggerTypeChoices,
    TaskPriorityChoices,
    TaskStatusChoices,
)
from .company import Company
from .users import User


class AutomationRule(TimestampedModel):
    """
    AutomationRule model - automated triggers and actions for companies.
    """
    # Use centralized choices directly
    TriggerType = AutomationTriggerTypeChoices
    ActionType = AutomationActionTypeChoices

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='automation_rules'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    trigger_type = models.CharField(max_length=50, choices=TriggerType.choices)
    conditions = models.JSONField(default=dict)
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    action_payload = models.JSONField(default=dict)
    is_active = models.BooleanField(default=True)
    last_run_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Automation Rule'
        verbose_name_plural = 'Automation Rules'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company.name} - {self.name}"


class Task(TimestampedModel):
    """
    Task model - tasks from automations and manual creation.
    """
    # Use centralized choices directly
    StatusChoices = TaskStatusChoices
    PriorityChoices = TaskPriorityChoices

    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name='automation_tasks'
    )
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)
    priority = models.CharField(max_length=20, choices=PriorityChoices.choices, default=PriorityChoices.MEDIUM)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tasks'
    )
    source_rule = models.ForeignKey(
        AutomationRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_tasks'
    )
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.company.name} - {self.title}"