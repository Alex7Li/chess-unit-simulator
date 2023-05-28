# Generated by Django 4.2 on 2023-05-24 17:47

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0011_remove_game_black_user_remove_game_board_setup_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamerequest',
            name='requesting_user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='move',
            name='implementation',
            field=models.JSONField(blank=True),
        ),
        migrations.CreateModel(
            name='Game',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('white_to_move', models.BooleanField(default=True)),
                ('game_state', models.JSONField()),
                ('black_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='black_user', to=settings.AUTH_USER_MODEL)),
                ('white_user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='white_user', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]