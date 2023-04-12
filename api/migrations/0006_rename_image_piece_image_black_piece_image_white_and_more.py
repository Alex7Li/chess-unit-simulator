# Generated by Django 4.1.5 on 2023-03-12 00:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_piece_author_alter_piecemove_piece'),
    ]

    operations = [
        migrations.RenameField(
            model_name='piece',
            old_name='image',
            new_name='image_black',
        ),
        migrations.AddField(
            model_name='piece',
            name='image_white',
            field=models.ImageField(default='tile_white.png', upload_to='pieces/'),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='piece',
            name='name',
            field=models.CharField(max_length=31),
        ),
    ]