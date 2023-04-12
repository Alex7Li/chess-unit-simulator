# Generated by Django 4.1.5 on 2023-03-14 01:33

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_rename_image_piece_image_black_piece_image_white_and_more'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='move',
            name='api_move_name_a970a7_idx',
        ),
        migrations.RemoveIndex(
            model_name='piecelocation',
            name='api_piecelo_board_i_6526c2_idx',
        ),
        migrations.RemoveField(
            model_name='piecelocation',
            name='board',
        ),
        migrations.AddField(
            model_name='boardsetup',
            name='cat',
            field=models.CharField(choices=[('official', 'Official'), ('custom', 'Custom')], default='custom', max_length=10),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='piecelocation',
            name='boardSetup',
            field=models.ForeignKey(default=0, on_delete=django.db.models.deletion.CASCADE, related_name='piece_locations', to='api.boardsetup'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='piecelocation',
            name='team',
            field=models.CharField(choices=[('white', 'White'), ('black', 'Black')], default='white', max_length=5),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='boardsetup',
            name='name',
            field=models.CharField(max_length=64, unique=True),
        ),
        migrations.AlterField(
            model_name='piece',
            name='cat',
            field=models.CharField(choices=[('official', 'Official'), ('custom', 'Custom')], max_length=10),
        ),
        migrations.AddIndex(
            model_name='move',
            index=models.Index(fields=['author'], name='api_move_author__0a9b2f_idx'),
        ),
        migrations.AddIndex(
            model_name='piecelocation',
            index=models.Index(fields=['boardSetup'], name='api_piecelo_boardSe_9efb58_idx'),
        ),
    ]