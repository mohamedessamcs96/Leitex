from django.contrib import admin
from .models import Category, MenuItem, ModifierGroup, ModifierOption


class ModifierOptionInline(admin.TabularInline):
    model  = ModifierOption
    extra  = 2
    fields = ['label', 'price_adj', 'sort_order']


class ModifierGroupInline(admin.StackedInline):
    model   = ModifierGroup
    extra   = 0
    inlines = [ModifierOptionInline]
    show_change_link = True


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'color', 'sort_order', 'is_active']
    list_editable = ['sort_order', 'is_active']


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display   = ['name', 'category', 'price', 'station', 'is_available']
    list_filter    = ['category', 'station', 'is_available']
    search_fields  = ['name']
    list_editable  = ['is_available']
    inlines        = [ModifierGroupInline]


@admin.register(ModifierGroup)
class ModifierGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'menu_item', 'required']
    inlines      = [ModifierOptionInline]
