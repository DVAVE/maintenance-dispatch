from django.contrib import admin
from .models import Profile, MaintenanceRequest


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('username', 'role')

    def username(self, obj):
        return obj.user.username
    username.short_description = 'Username'


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ('title', 'status', 'created_by', 'assigned_to', 'created_at')
    list_filter = ('status', 'assigned_to')
    search_fields = ('title', 'created_by__username')
