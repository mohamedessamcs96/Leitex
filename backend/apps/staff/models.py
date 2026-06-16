from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class StaffManager(BaseUserManager):
    def create_user(self, username, name, role, pin, password=None):
        user = self.model(username=username, name=name, role=role, pin=pin)
        user.set_password(password or pin)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, name, role='ADMIN', pin='0000', password=None):
        user = self.create_user(username, name, role, pin, password)
        user.is_admin = True
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class StaffMember(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('ADMIN',   'Admin'),
        ('MANAGER', 'Manager'),
        ('CASHIER', 'Cashier'),
        ('WAITER',  'Waiter'),
        ('KITCHEN', 'Kitchen'),
    ]

    username   = models.CharField(max_length=50, unique=True)
    name       = models.CharField(max_length=120)
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES, default='WAITER')
    pin        = models.CharField(max_length=10)
    is_active  = models.BooleanField(default=True)
    is_admin   = models.BooleanField(default=False)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = StaffManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['name', 'role', 'pin']

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.role})'


class ShiftSession(models.Model):
    staff      = models.ForeignKey(StaffMember, on_delete=models.CASCADE, related_name='sessions')
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at   = models.DateTimeField(null=True, blank=True)
    notes      = models.TextField(blank=True)

    class Meta:
        ordering = ['-started_at']

    def __str__(self):
        return f'{self.staff.name} — {self.started_at.date()}'
