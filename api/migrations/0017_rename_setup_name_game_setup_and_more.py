# Generated by Django 4.2.2 on 2023-06-08 19:42

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0016_game_setup_name_alter_boardsetup_cat_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='game',
            old_name='setup_name',
            new_name='setup',
        ),
        migrations.AddIndex(
            model_name='boardsetup',
            index=models.Index(fields=['cat', 'author'], name='api_boardse_cat_5c8557_idx'),
        ),
        migrations.AddIndex(
            model_name='game',
            index=models.Index(fields=['white_user', 'black_user'], name='api_game_white_u_331dd2_idx'),
        ),
        migrations.AddIndex(
            model_name='piece',
            index=models.Index(fields=['author', 'cat'], name='api_piece_author__c87b57_idx'),
        ),
    ]
