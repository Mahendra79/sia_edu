from django.db.models.signals import post_delete, pre_save
from django.dispatch import receiver

from accounts.models import User


def _delete_file(field_file):
    if field_file and field_file.name:
        field_file.storage.delete(field_file.name)


@receiver(pre_save, sender=User)
def delete_old_avatar_on_change(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old_avatar = User.objects.only("avatar").get(pk=instance.pk).avatar
    except User.DoesNotExist:
        return

    new_avatar = instance.avatar
    old_name = old_avatar.name if old_avatar else None
    new_name = new_avatar.name if new_avatar else None
    if old_name and old_name != new_name:
        _delete_file(old_avatar)


@receiver(post_delete, sender=User)
def delete_avatar_on_user_delete(sender, instance, **kwargs):
    _delete_file(instance.avatar)
