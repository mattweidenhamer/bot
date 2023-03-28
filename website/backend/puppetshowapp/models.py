from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
import uuid


#################################################################
# Helper Functions
#################################################################


def user_pfp_path(instance, filename):
    return f"profiles/{instance.user_username}/{filename}"


def user_actor_path(instance, filename):
    return f"profiles/{instance.actor_base_user.user_username}/{filename}"


#################################################################
# User Data Models
#################################################################


# The user's snowflake, Discord Name, and any other neccesary parts
class DiscordData(models.Model):
    user_snowflake = models.CharField(max_length=20, unique=True)
    user_username = models.CharField(max_length=100)
    profile_picture = models.ImageField(upload_to=user_pfp_path)

    def __str__(self) -> str:
        return str(self.user_username)

    class Meta:
        db_table = "discord_user_data"


class DiscordPointingUserManager(BaseUserManager):
    def create_user_from_snowflake(self, email, password, discord_snowflake):
        if not email or not discord_snowflake:
            raise ValueError("Email and discord snowflake must be passed.")
        discord, created = DiscordData.objects.get_or_create(
            user_snowflake=discord_snowflake
        )
        if created:
            print("Created an empty discord user for account")
            # TODO will need to also grab and sync discord information
        user = self.model(email=email, discord_data=discord)
        user.set_password(password)
        user.save()
        return user

    def create_superuser_from_snowflake(self, email, password, discord_snowflake):
        user = self.create_user_from_snowflake(email, password, discord_snowflake)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        return user

    def create_user(self, email, password, discord_data):
        if not email or not discord_data:
            raise ValueError("Email and discord data must be passed.")
        user = self.model(email=email, discord_data=discord_data)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password, discord_data):
        user = self.create_user(email, password, discord_data)
        user.is_superuser = True
        user.is_staff = True
        user.save()
        return user


class DiscordPointingUser(AbstractBaseUser):
    email = models.EmailField(("email_address"), unique=True)
    discord_data = models.OneToOneField(DiscordData, on_delete=models.DO_NOTHING)
    is_superuser = models.BooleanField(default=False)

    objects = DiscordPointingUserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["discord_data"]

    def __str__(self) -> str:
        if self.discord_data.user_username is None:
            return self.email
        return self.discord_data.user_username

    def has_perm(self, perm, obj=None):
        if self.is_superuser:
            return True
        elif isinstance(obj, Actor):
            if obj.scene.scene_author.pk == self.pk:
                return True
            return False
        elif isinstance(obj, Scene):
            if obj.scene_author.pk == self.pk:
                return True
            return False
        return False


################################################################
# Object Models
################################################################


# A "scene" is a configuration of a certain set of actors.
# Each has their own
class Scene(models.Model):
    scene_author = models.ForeignKey(DiscordPointingUser, on_delete=models.CASCADE)
    scene_name = models.CharField(max_length=30)

    def __str__(self) -> str:
        return f"{self.scene_author} {self.scene_name} scene"

    # Include any further needed names for configuration

    class Meta:
        db_table = "scenes"


# An "Actor" is a visualization of the user in a scene.
# It is the main representation of the screen that a user gets.
class Actor(models.Model):
    # TODO set up so that it deletes images that are currently being unused
    # A unique hash of the person's ID, the emotion name,
    actor_hash = models.UUIDField(default=uuid.uuid4)

    # The ID of the user actually being drawn
    actor_base_user = models.ForeignKey(DiscordData, on_delete=models.CASCADE)

    actor_name = models.CharField(max_length=30)

    # What Scene they belong to
    scene = models.ForeignKey(Scene, on_delete=models.CASCADE)

    # Default animations
    speaking_animation = models.ImageField(upload_to=user_actor_path)
    not_speaking_animation = models.ImageField(upload_to=user_actor_path)

    # When not speaking for a while, NYI
    sleeping_animation = models.ImageField(null=True, blank=True)

    # NYI
    connection_animation = models.ImageField(null=True, blank=True)
    disconnect_animation = models.ImageField(null=True, blank=True)

    class Meta:
        db_table = "charactor_actors"

    def __str__(self) -> str:
        return f"{self.actor_base_user} {self.scene.scene_name}"

    def save(self, *args, **kwargs):
        if self.actor_name is None or self.actor_name == "":
            self.actor_name = self.actor_base_user.user_username
        super().save(*args, **kwargs)

    # # Overwrite the default save function
    # Not used, but saved for posterity
    # def save(self, *args, **kwargs):
    #     prehash_string = (
    #         str(self.actor_base_user.user_snowflake)
    #         + str(self.scene.scene_name)
    #         + str(self.pk)
    #     )
    #     hasher = md5(prehash_string, usedforsecurity=False)
    #     self.actor_hash = hasher.hexdigest()
    #     super().save(*args, **kwargs)


# An "emotion" is an extra configuration of states.
# Eventually, a user from another portion of the site should be able to push a button
# that changes their emotion on the website.

# NYI


class Emotion(models.Model):
    # A unique hash of the person's ID, the emotion name,
    emotion_hash = models.CharField(max_length=200)

    # The emotion "name," default to "Neutral"
    emotion_name = models.CharField(
        max_length=15, default="Neutral", null=True, blank=True
    )

    # What actor they belong to
    actor = models.ForeignKey(Actor, on_delete=models.CASCADE)

    # Default animations
    speaking_animation = models.ImageField(upload_to=user_pfp_path)
    not_speaking_animation = models.ImageField(upload_to=user_pfp_path)

    # When not speaking for a while, NYI
    sleeping_animation = models.ImageField(null=True, blank=True)

    # NYI
    connection_animation = models.ImageField(null=True, blank=True)
    disconnect_animation = models.ImageField(null=True, blank=True)

    class Meta:
        db_table = "character_emotions"
