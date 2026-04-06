from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    ChangePasswordSerializer, DoctorProfileSerializer,
    PharmacyProfileSerializer, ProfileUpdateSerializer, get_tokens_for_user,
)
from .models import DoctorProfile, PharmacyProfile

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        response_data = {
            'user': UserSerializer(user).data,
            'needsApproval': not user.is_approved,
        }

        # Only return tokens if user is auto-approved
        if user.is_approved:
            response_data['tokens'] = get_tokens_for_user(user)

        return Response(response_data, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        # Build user data with role-specific profile
        user_data = UserSerializer(user).data
        if user.role == User.Role.DOCTOR and hasattr(user, 'doctor_profile'):
            user_data['doctor_profile'] = DoctorProfileSerializer(user.doctor_profile).data
        elif user.role == User.Role.PHARMACY and hasattr(user, 'pharmacy_profile'):
            user_data['pharmacy_profile'] = PharmacyProfileSerializer(user.pharmacy_profile).data

        return Response({
            'user': user_data,
            'tokens': get_tokens_for_user(user),
        })


class LogoutView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'message': 'Logged out successfully'})
        except Exception:
            return Response({'message': 'Logout failed'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        return Response(self._serialize_profile(self.get_object()))

    def _serialize_profile(self, user):
        data = UserSerializer(user).data

        if user.role == User.Role.DOCTOR and hasattr(user, 'doctor_profile'):
            data['doctor_profile'] = DoctorProfileSerializer(user.doctor_profile).data
        elif user.role == User.Role.PHARMACY and hasattr(user, 'pharmacy_profile'):
            data['pharmacy_profile'] = PharmacyProfileSerializer(user.pharmacy_profile).data

        return data

    def update(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = self.get_object()
        data = serializer.validated_data

        for field in ['name', 'phone', 'avatar', 'fcm_token']:
            if field in data:
                setattr(user, field, data[field])

        doctor_profile_data = data.get('doctor_profile')
        if doctor_profile_data and user.role == User.Role.DOCTOR:
            doctor_profile, _ = DoctorProfile.objects.get_or_create(user=user)
            for field, value in doctor_profile_data.items():
                setattr(doctor_profile, field, value)
            doctor_profile.save()

        pharmacy_profile_data = data.get('pharmacy_profile')
        if pharmacy_profile_data and user.role == User.Role.PHARMACY:
            pharmacy_profile, _ = PharmacyProfile.objects.get_or_create(user=user)
            for field, value in pharmacy_profile_data.items():
                setattr(pharmacy_profile, field, value)
            pharmacy_profile.save()

        user.save()

        return Response(self._serialize_profile(user))


class ChangePasswordView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'message': 'Password changed successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'message': 'Email is required'}, status=400)

    try:
        user = User.objects.get(email=email)
        # TODO: Send reset email with token
        return Response({'message': 'Reset link sent to your email'})
    except User.DoesNotExist:
        # Don't reveal whether email exists
        return Response({'message': 'Reset link sent to your email'})


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """Reset password with email and new password (after forgot-password flow)."""
    email = request.data.get('email')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')

    if not all([email, new_password, confirm_password]):
        return Response(
            {'message': 'Email, new password, and confirm password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_password != confirm_password:
        return Response(
            {'message': 'Passwords do not match'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(new_password) < 8:
        return Response(
            {'message': 'Password must be at least 8 characters long'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password reset successfully'}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response(
            {'message': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
