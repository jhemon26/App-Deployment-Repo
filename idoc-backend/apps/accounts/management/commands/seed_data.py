from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.accounts.models import DoctorProfile, PharmacyProfile
from apps.pharmacies.models import Medicine

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed optional demo data when RUN_SEED_DATA=true'

    def handle(self, *args, **options):
        if not getattr(settings, 'RUN_SEED_DATA', False):
            self.stdout.write('Skipping demo seed data (RUN_SEED_DATA=false).')
            return

        if User.objects.filter(email='admin@idoc.com').exists():
            self.stdout.write('Data already seeded.')
            return

        # ─── Admin ───
        admin = User.objects.create_superuser(
            email='admin@idoc.com',
            password='admin123',
            name='System Admin',
            phone='+1234567890',
        )
        self.stdout.write(self.style.SUCCESS(f'Created admin: {admin.email}'))

        # ─── Doctors ───
        doctors_data = [
            {'name': 'Dr. Sarah Chen', 'email': 'sarah@idoc.com', 'specialty': 'General Medicine', 'experience': '12 years', 'fee': 500, 'license': 'MD-10001'},
            {'name': 'Dr. James Okafor', 'email': 'james@idoc.com', 'specialty': 'Pediatrics', 'experience': '8 years', 'fee': 600, 'license': 'MD-10002'},
            {'name': 'Dr. Aisha Patel', 'email': 'aisha@idoc.com', 'specialty': 'Dermatology', 'experience': '15 years', 'fee': 700, 'license': 'MD-10003'},
            {'name': 'Dr. Marcus Lee', 'email': 'marcus@idoc.com', 'specialty': 'Cardiology', 'experience': '20 years', 'fee': 900, 'license': 'MD-10004'},
            {'name': 'Dr. Elena Ruiz', 'email': 'elena@idoc.com', 'specialty': 'Psychiatry', 'experience': '10 years', 'fee': 800, 'license': 'MD-10005'},
        ]

        for d in doctors_data:
            user = User.objects.create_user(
                email=d['email'], password='doctor123',
                name=d['name'], role='doctor', is_approved=True,
            )
            DoctorProfile.objects.create(
                user=user, specialty=d['specialty'],
                experience=d['experience'], fee=d['fee'],
                license_number=d['license'], rating=4.5 + (hash(d['name']) % 5) / 10,
                is_available=True,
            )
            self.stdout.write(self.style.SUCCESS(f'Created doctor: {user.email}'))

        # ─── Pharmacies ───
        pharmacies_data = [
            {'name': 'MedPlus Pharmacy', 'email': 'medplus@idoc.com', 'license': 'PH-20001', 'address': '123 Health Street'},
            {'name': 'HealthHub Drugs', 'email': 'healthhub@idoc.com', 'license': 'PH-20002', 'address': '456 Wellness Ave'},
            {'name': 'CareFirst Pharmacy', 'email': 'carefirst@idoc.com', 'license': 'PH-20003', 'address': '789 Care Blvd'},
        ]

        for p in pharmacies_data:
            user = User.objects.create_user(
                email=p['email'], password='pharmacy123',
                name=p['name'], role='pharmacy', is_approved=True,
            )
            PharmacyProfile.objects.create(
                user=user, pharmacy_name=p['name'],
                license_number=p['license'], address=p['address'],
                rating=4.3 + (hash(p['name']) % 5) / 10,
            )

            # Add medicines
            medicines = [
                {'name': 'Paracetamol 500mg', 'price': 35, 'category': 'Pain Relief', 'stock': 500},
                {'name': 'Amoxicillin 250mg', 'price': 120, 'category': 'Antibiotics', 'stock': 200, 'rx': True},
                {'name': 'Cetirizine 10mg', 'price': 45, 'category': 'Allergy', 'stock': 300},
                {'name': 'Omeprazole 20mg', 'price': 80, 'category': 'Gastric', 'stock': 150},
                {'name': 'Vitamin D3 1000IU', 'price': 250, 'category': 'Supplements', 'stock': 600},
                {'name': 'Ibuprofen 400mg', 'price': 40, 'category': 'Pain Relief', 'stock': 350},
            ]
            for m in medicines:
                Medicine.objects.create(
                    pharmacy=user, name=m['name'], price=m['price'],
                    category=m['category'], stock=m['stock'],
                    requires_prescription=m.get('rx', False),
                )

            self.stdout.write(self.style.SUCCESS(f'Created pharmacy: {user.email} with {len(medicines)} medicines'))

        # ─── General Users ───
        users_data = [
            {'name': 'John Patient', 'email': 'john@idoc.com'},
            {'name': 'Maria Garcia', 'email': 'maria@idoc.com'},
            {'name': 'Alex Wong', 'email': 'alex@idoc.com'},
        ]

        for u in users_data:
            user = User.objects.create_user(
                email=u['email'], password='user123',
                name=u['name'], role='general',
            )
            self.stdout.write(self.style.SUCCESS(f'Created user: {user.email}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write('\nLogin credentials:')
        self.stdout.write('  Admin:    admin@idoc.com / admin123')
        self.stdout.write('  Doctor:   sarah@idoc.com / doctor123')
        self.stdout.write('  Pharmacy: medplus@idoc.com / pharmacy123')
        self.stdout.write('  Patient:  john@idoc.com / user123')
