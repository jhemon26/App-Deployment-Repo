import csv
import random
import string
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User, DoctorProfile, PharmacyProfile
from apps.availability.models import DoctorAvailability
from apps.bookings.models import Booking
from apps.chat.models import ChatRoom, Message
from apps.notifications.models import Notification
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.pharmacies.models import Medicine
from apps.requests.models import PatientRequest


class Command(BaseCommand):
    help = 'Seed realistic demo data (~20 accounts) for end-to-end testing.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete existing seeded users and regenerate all data.')

    @staticmethod
    def _pwd(length=12):
        alphabet = string.ascii_letters + string.digits + '!@#$%'
        return ''.join(random.choice(alphabet) for _ in range(length))

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(26042026)

        if options['reset']:
            seeded = User.objects.filter(email__iendswith='@seed.idoc.local')
            seeded_count = seeded.count()
            seeded.delete()
            self.stdout.write(self.style.WARNING(f'Removed {seeded_count} previously seeded users.'))

        role_counts = {
            'general': 5,
            'doctor': 5,
            'pharmacy': 5,
            'admin': 5,
        }

        users = []
        credentials = []

        specialties = ['General Medicine', 'Cardiology', 'Pediatrics', 'Dermatology', 'Neurology']
        pharmacy_names = ['CityCare', 'MedWay', 'PharmaPlus', 'HealthHub', 'QuickMeds']
        medicine_names = [
            ('Paracetamol 500mg', 'Pain Relief'),
            ('Amoxicillin 250mg', 'Antibiotic'),
            ('Cetirizine 10mg', 'Allergy'),
            ('Omeprazole 20mg', 'Gastro'),
            ('Vitamin C 1000mg', 'Supplements'),
        ]

        self.stdout.write('Creating users and profiles...')
        for role, total in role_counts.items():
            for idx in range(1, total + 1):
                email = f'{role}{idx}@seed.idoc.local'
                name_prefix = 'Dr.' if role == 'doctor' else role.capitalize()
                name = f'{name_prefix} Seed {idx}'
                password = self._pwd()

                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'name': name,
                        'phone': f'+8801{random.randint(100000000, 999999999)}',
                        'role': role,
                        'is_approved': True if role in ['doctor', 'pharmacy', 'admin', 'general'] else False,
                        'is_blocked': False,
                        'is_staff': role == 'admin',
                        'is_superuser': False,
                    },
                )

                if created:
                    user.set_password(password)
                    user.save()
                else:
                    # Keep existing users but rotate deterministic test password for current run visibility.
                    user.name = name
                    user.phone = user.phone or f'+8801{random.randint(100000000, 999999999)}'
                    if role in ['doctor', 'pharmacy', 'admin', 'general']:
                        user.is_approved = True
                    user.is_staff = role == 'admin'
                    user.set_password(password)
                    user.save()

                users.append(user)
                credentials.append({
                    'id': str(user.id),
                    'role': user.role,
                    'email': user.email,
                    'password': password,
                    'name': user.name,
                })

        doctors = [u for u in users if u.role == 'doctor']
        patients = [u for u in users if u.role == 'general']
        pharmacies = [u for u in users if u.role == 'pharmacy']

        for i, doctor in enumerate(doctors):
            DoctorProfile.objects.update_or_create(
                user=doctor,
                defaults={
                    'specialty': specialties[i % len(specialties)],
                    'experience': f'{5 + i} years',
                    'fee': Decimal('600.00') + Decimal(i * 100),
                    'license_number': f'DOC-SEED-{1000 + i}',
                    'bio': f'Experienced {specialties[i % len(specialties)]} specialist.',
                    'is_available': True,
                    'rating': Decimal('4.5'),
                    'total_patients': 20 + i * 3,
                    'total_consultations': 120 + i * 10,
                },
            )

        for i, pharmacy in enumerate(pharmacies):
            PharmacyProfile.objects.update_or_create(
                user=pharmacy,
                defaults={
                    'pharmacy_name': f'{pharmacy_names[i % len(pharmacy_names)]} Pharmacy',
                    'license_number': f'PH-SEED-{2000 + i}',
                    'address': f'{10 + i} Seed Road, Dhaka',
                    'delivery_time': '30-45 min',
                    'is_open': True,
                    'rating': Decimal('4.4'),
                },
            )

        self.stdout.write('Creating pharmacy inventory...')
        medicines = []
        for p_idx, pharmacy in enumerate(pharmacies):
            for m_idx, (m_name, m_cat) in enumerate(medicine_names):
                med, _ = Medicine.objects.update_or_create(
                    pharmacy=pharmacy,
                    name=f'{m_name} #{p_idx + 1}',
                    defaults={
                        'description': f'{m_name} for common {m_cat.lower()} use.',
                        'category': m_cat,
                        'price': Decimal('80.00') + Decimal(m_idx * 25),
                        'stock': 10 + m_idx * 20,
                        'requires_prescription': m_cat == 'Antibiotic',
                        'is_active': True,
                    },
                )
                medicines.append(med)

        self.stdout.write('Creating availability and requests...')
        today = date.today()
        for idx, doctor in enumerate(doctors):
            for offset in [0, 1, 2]:
                DoctorAvailability.objects.update_or_create(
                    doctor=doctor,
                    date=today + timedelta(days=offset),
                    start_time=time(hour=9 + idx % 3),
                    end_time=time(hour=12 + idx % 3),
                    defaults={
                        'consultation_type': 'both' if idx % 2 == 0 else 'video',
                        'max_bookings': 4,
                        'notes': 'Seeded availability slot',
                        'is_active': True,
                    },
                )

        request_statuses = ['open', 'open', 'resolved', 'cancelled', 'open']
        urgencies = ['low', 'medium', 'high', 'medium', 'high']
        for idx, patient in enumerate(patients):
            PatientRequest.objects.update_or_create(
                patient=patient,
                specialty=specialties[idx % len(specialties)],
                symptoms=f'Seed symptom report {idx + 1}',
                preferred_date=today + timedelta(days=idx % 3),
                defaults={
                    'urgency': urgencies[idx],
                    'preferred_time_range': ['morning', 'afternoon', 'evening'][idx % 3],
                    'notes': 'Auto-seeded request',
                    'status': request_statuses[idx],
                },
            )

        self.stdout.write('Creating bookings, orders, payments, notifications, chats...')
        booking_statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']
        created_bookings = []
        for idx, patient in enumerate(patients):
            doctor = doctors[idx % len(doctors)]
            booking, _ = Booking.objects.update_or_create(
                patient=patient,
                doctor=doctor,
                date=today + timedelta(days=idx - 2),
                time_slot=time(hour=10 + (idx % 4), minute=0),
                defaults={
                    'consultation_type': 'video' if idx % 2 == 0 else 'chat',
                    'status': booking_statuses[idx % len(booking_statuses)],
                    'symptoms': f'Consultation reason {idx + 1}',
                    'fee': doctor.doctor_profile.fee,
                    'notes': 'Seeded booking',
                },
            )
            created_bookings.append(booking)

            Notification.objects.get_or_create(
                user=patient,
                title='Booking Update',
                body=f'Your booking with {doctor.name} is {booking.status}.',
                notification_type='booking',
            )

        created_orders = []
        order_statuses = ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered']
        for idx, patient in enumerate(patients):
            pharmacy = pharmacies[idx % len(pharmacies)]
            subtotal = Decimal('220.00') + Decimal(idx * 30)
            order, _ = Order.objects.update_or_create(
                customer=patient,
                pharmacy=pharmacy,
                delivery_address=f'{idx + 1} Seed Street, Dhaka',
                defaults={
                    'status': order_statuses[idx],
                    'subtotal': subtotal,
                    'delivery_fee': Decimal('50.00'),
                    'total': subtotal + Decimal('50.00'),
                    'notes': 'Seeded medicine order',
                },
            )
            created_orders.append(order)
            med = medicines[idx % len(medicines)]
            OrderItem.objects.update_or_create(
                order=order,
                medicine=med,
                defaults={
                    'quantity': 1 + (idx % 3),
                    'price': med.price,
                    'total': med.price * Decimal(1 + (idx % 3)),
                },
            )

            Notification.objects.get_or_create(
                user=patient,
                title='Order Update',
                body=f'Order {order.order_number} is {order.status}.',
                notification_type='order',
            )

        for idx, booking in enumerate(created_bookings):
            Payment.objects.update_or_create(
                user=booking.patient,
                payment_type='booking',
                booking=booking,
                defaults={
                    'amount': booking.fee,
                    'status': 'completed' if booking.status in ['confirmed', 'completed', 'in_progress'] else 'pending',
                },
            )

        for idx, order in enumerate(created_orders):
            Payment.objects.update_or_create(
                user=order.customer,
                payment_type='order',
                order=order,
                defaults={
                    'amount': order.total,
                    'status': 'completed' if order.status == 'delivered' else 'pending',
                },
            )

        for idx in range(min(5, len(created_bookings))):
            booking = created_bookings[idx]
            room, _ = ChatRoom.objects.get_or_create(booking=booking)
            room.participants.set([booking.patient, booking.doctor])
            Message.objects.get_or_create(
                room=room,
                sender=booking.patient,
                content='Hello doctor, I have uploaded my symptoms.',
            )
            Message.objects.get_or_create(
                room=room,
                sender=booking.doctor,
                content='Thanks, I reviewed your details. Let us proceed.',
            )

        out_path = 'seed_accounts.csv'
        with open(out_path, 'w', newline='') as fp:
            writer = csv.DictWriter(fp, fieldnames=['id', 'role', 'email', 'password', 'name'])
            writer.writeheader()
            for row in credentials:
                writer.writerow(row)

        self.stdout.write(self.style.SUCCESS('Demo data seeding complete.'))
        self.stdout.write(self.style.SUCCESS(f'Accounts exported: {out_path}'))
        self.stdout.write(self.style.SUCCESS(f'Total accounts: {len(credentials)}'))
