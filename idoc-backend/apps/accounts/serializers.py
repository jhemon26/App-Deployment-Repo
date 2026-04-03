from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, DoctorProfile, PharmacyProfile


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name', 'phone', 'role', 'avatar',
                  'is_approved', 'is_blocked', 'created_at']
        read_only_fields = ['id', 'is_approved', 'is_blocked', 'created_at']


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = DoctorProfile
        fields = '__all__'


class PharmacyProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PharmacyProfile
        fields = '__all__'


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=6, write_only=True)
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=20, required=False, default='')
    role = serializers.ChoiceField(choices=User.Role.choices)

    # Doctor-specific
    specialty = serializers.CharField(max_length=100, required=False)
    experience = serializers.CharField(max_length=50, required=False)
    fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    license_number = serializers.CharField(max_length=100, required=False)

    # Pharmacy-specific
    pharmacy_name = serializers.CharField(max_length=255, required=False)
    pharmacy_license = serializers.CharField(max_length=100, required=False)
    address = serializers.CharField(required=False)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered')
        return value

    def create(self, validated_data):
        role = validated_data['role']

        # Extract role-specific fields
        doctor_fields = {
            'specialty': validated_data.pop('specialty', ''),
            'experience': validated_data.pop('experience', ''),
            'fee': validated_data.pop('fee', 0),
            'license_number': validated_data.pop('license_number', validated_data.pop('license', '')),
            'bio': validated_data.pop('bio', ''),
        }
        pharmacy_fields = {
            'pharmacy_name': validated_data.pop('pharmacy_name', validated_data.pop('pharmacyName', '')),
            'license_number': validated_data.pop('pharmacy_license', validated_data.pop('pharmacyLicense', '')),
            'address': validated_data.pop('address', ''),
        }

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            name=validated_data['name'],
            phone=validated_data.get('phone', ''),
            role=role,
        )

        # Create role-specific profile
        if role == User.Role.DOCTOR and doctor_fields:
            DoctorProfile.objects.create(user=user, **doctor_fields)
        elif role == User.Role.PHARMACY and pharmacy_fields:
            PharmacyProfile.objects.create(
                user=user,
                pharmacy_name=pharmacy_fields.get('pharmacy_name', ''),
                license_number=pharmacy_fields.get('pharmacy_license', ''),
                address=pharmacy_fields.get('address', ''),
            )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password')
        if user.is_blocked:
            raise serializers.ValidationError('Your account has been blocked. Contact support.')
        if not user.is_approved:
            raise serializers.ValidationError('Your account is pending admin approval.')
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=6)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect')
        return value


class DoctorProfileUpdateSerializer(serializers.Serializer):
    specialty = serializers.CharField(max_length=100, required=False)
    experience = serializers.CharField(max_length=50, required=False)
    fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    license_number = serializers.CharField(max_length=100, required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    is_available = serializers.BooleanField(required=False)
    schedule = serializers.JSONField(required=False)


class PharmacyProfileUpdateSerializer(serializers.Serializer):
    pharmacy_name = serializers.CharField(max_length=255, required=False)
    license_number = serializers.CharField(max_length=100, required=False)
    address = serializers.CharField(required=False)
    latitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=10, decimal_places=7, required=False, allow_null=True)
    delivery_time = serializers.CharField(max_length=50, required=False)
    is_open = serializers.BooleanField(required=False)


class ProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=20, required=False)
    avatar = serializers.ImageField(required=False, allow_null=True)
    fcm_token = serializers.CharField(max_length=500, required=False, allow_blank=True)
    doctor_profile = DoctorProfileUpdateSerializer(required=False)
    pharmacy_profile = PharmacyProfileUpdateSerializer(required=False)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }
