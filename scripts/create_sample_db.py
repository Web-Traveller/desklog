import sqlite3
import os
import shutil
import json
from datetime import datetime, timedelta

def create_sample_database(output_path):
    if os.path.exists(output_path):
        os.remove(output_path)

    conn = sqlite3.connect(output_path)
    cur = conn.cursor()

    # Create tables per schema v3
    cur.executescript("""
    CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        mobile TEXT,
        note TEXT,
        aadhaar_number TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_verified INTEGER DEFAULT 0,
        avatar_initials TEXT,
        avatar_color TEXT
    );

    CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        default_price INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        service_id TEXT,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        scheduled_date TEXT,
        scheduled_time TEXT,
        target_date TEXT,
        notes TEXT,
        billing_amount INTEGER,
        cancellation_reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE,
        FOREIGN KEY(service_id) REFERENCES services(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
        id TEXT PRIMARY KEY,
        activity_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        task_id TEXT,
        customer_id TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS banking_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL,
        payment_mode TEXT NOT NULL,
        amount INTEGER NOT NULL,
        transaction_ref_no TEXT,
        metadata TEXT,
        transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_deleted BOOLEAN DEFAULT 0,
        FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_tasks_customer_id ON tasks(customer_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_target_date ON tasks(target_date);
    CREATE INDEX IF NOT EXISTS idx_payments_task_id ON payments(task_id);
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
    CREATE INDEX IF NOT EXISTS idx_banking_transactions_customer_id ON banking_transactions(customer_id);

    PRAGMA user_version = 3;
    """)

    now = datetime.now()
    def iso_date(days_offset=0, hours_offset=0):
        dt = now + timedelta(days=days_offset, hours=hours_offset)
        return dt.isoformat()

    def ymd_date(days_offset=0):
        dt = now + timedelta(days=days_offset)
        return dt.strftime('%Y-%m-%d')

    # 1. Services Catalog (8 services, prices in paise)
    services_data = [
        ('svc-pan', 'New PAN Card Application', 25000),      # ₹250
        ('svc-aadhaar', 'Aadhaar Biometric & Address Update', 15000), # ₹150
        ('svc-income', 'Income Certificate Certificate Issuance', 35000), # ₹350
        ('svc-caste', 'Caste Certificate Verification', 40000), # ₹400
        ('svc-passport', 'Passport Online Slot & Form Filing', 60000), # ₹600
        ('svc-dl', 'Driving License Renewal / LL Form', 45000), # ₹450
        ('svc-police', 'Police Character Verification NOC', 30000), # ₹300
        ('svc-bill', 'Electricity & Municipal Bill Payment', 5000), # ₹50
    ]
    for s_id, s_name, s_price in services_data:
        cur.execute(
            "INSERT INTO services (id, name, default_price, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)",
            (s_id, s_name, s_price, iso_date(-30), iso_date(-30))
        )

    # 2. Customers (15 realistic profiles)
    customers_data = [
        ('cust-general', 'General / Walk-in Client', None, 'Default walk-in desk profile', None, 'GW', 'bg-surface-container text-on-surface-variant', 0),
        ('cust-01', 'Rajesh Sharma', '9822014567', 'Regular customer from Shivajinagar', '845212349012', 'RS', 'bg-primary-container text-on-primary-container', 1),
        ('cust-02', 'Priya Deshmukh', '9890123456', 'College student, needs urgent documents', '901234567890', 'PD', 'bg-secondary-container text-on-secondary-container', 1),
        ('cust-03', 'Amit Kulkarni', '9765432109', 'Farmer subsidy application documents', '432187650987', 'AK', 'bg-tertiary-container text-on-tertiary-container', 0),
        ('cust-04', 'Sunita Patil', '9423156789', 'Retired teacher pension paperwork', '654321098765', 'SP', 'bg-primary-container text-on-primary-container', 1),
        ('cust-05', 'Vikram Jadhav', '9158765432', 'Transport contractor, frequent banking', '789012345678', 'VJ', 'bg-secondary-container text-on-secondary-container', 1),
        ('cust-06', 'Meera Joshi', '9970112233', 'Applying for abroad higher studies', '345678901234', 'MJ', 'bg-tertiary-container text-on-tertiary-container', 1),
        ('cust-07', 'Ganesh Shinde', '9860445566', 'Shopkeeper near main road', '234567890123', 'GS', 'bg-primary-container text-on-primary-container', 0),
        ('cust-08', 'Anjali Gaikwad', '9552887766', 'Scholarship forms verification', '123456789012', 'AG', 'bg-secondary-container text-on-secondary-container', 1),
        ('cust-09', 'Sachin More', '9881332211', 'Auto rickshaw driver, meter renewal', '567890123456', 'SM', 'bg-tertiary-container text-on-tertiary-container', 0),
        ('cust-10', 'Kavita Chavan', '9404998877', 'Anganwadi worker, family ration card', '678901234567', 'KC', 'bg-primary-container text-on-primary-container', 1),
        ('cust-11', 'Dinesh Pawar', '9823554433', 'Government job exam application', '789012345678', 'DP', 'bg-secondary-container text-on-secondary-container', 0),
        ('cust-12', 'Pooja Kale', '9730221100', 'Passport Tatkal application', '890123456789', 'PK', 'bg-tertiary-container text-on-tertiary-container', 1),
        ('cust-13', 'Suresh Tambe', '9657443322', 'Property tax and 7/12 extract print', '901234567890', 'ST', 'bg-primary-container text-on-primary-container', 0),
        ('cust-14', 'Rohan Sawant', '9922665544', 'GST registration consultation', '012345678901', 'RS', 'bg-secondary-container text-on-secondary-container', 1),
    ]

    for c_id, name, mob, note, aadh, init, col, ver in customers_data:
        cur.execute(
            """INSERT INTO customers (id, name, mobile, note, aadhaar_number, created_at, updated_at, is_active, is_verified, avatar_initials, avatar_color)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)""",
            (c_id, name, mob, note, aadh, iso_date(-25), iso_date(-1), ver, init, col)
        )

    # 3. Tasks (30 realistic counter tasks across statuses)
    tasks_data = [
        # (id, cust_id, svc_id, title, status, sched_days, target_days, notes, amount, cancel_reason, comp_days)
        ('task-01', 'cust-01', 'svc-pan', 'PAN Card Correction & Father Name Update', 'PENDING', 0, 3, 'Form 49A uploaded, pending biometric confirmation', 25000, None, None),
        ('task-02', 'cust-02', 'svc-income', 'Tehsildar Income Certificate (FY 2025-26)', 'PROCESSING', -1, 2, 'Submitted to local revenue circle office', 35000, None, None),
        ('task-03', 'cust-03', 'svc-caste', 'Caste Certificate Digital Attestation', 'READY', -3, 0, 'Ready for customer pickup and original stamp', 40000, None, None),
        ('task-04', 'cust-04', 'svc-aadhaar', 'Aadhaar Mobile Link & Address Update', 'DELIVERED', -5, -2, 'OTP verified, acknowledgment slip handed over', 15000, None, -2),
        ('task-05', 'cust-05', 'svc-dl', 'Heavy Vehicle Driving License Renewal', 'PROCESSING', 1, 5, 'Medical certificate Form 1A attached', 45000, None, None),
        ('task-06', 'cust-06', 'svc-passport', 'Passport Appointment Booking - Pune RPO', 'READY', -2, 1, 'Appointment booked for 18th Oct, slot receipt printed', 60000, None, None),
        ('task-07', 'cust-07', 'svc-bill', 'MSEB Commercial Meter Bill Payment', 'DELIVERED', -10, -9, 'Payment successful, receipt given', 5000, None, -9),
        ('task-08', 'cust-08', 'svc-caste', 'Non-Creamy Layer Certificate Application', 'PENDING', 2, 4, 'Waiting for grandfather school leaving certificate', 40000, None, None),
        ('task-09', 'cust-09', 'svc-pan', 'New Instant e-PAN Generation via Aadhaar', 'DELIVERED', -7, -6, 'PDF generated and color print delivered with lamination', 25000, None, -6),
        ('task-10', 'cust-10', 'svc-income', 'EWS Certificate Income Proof Verification', 'CANCELLED', -8, -5, 'Applicant not eligible under income criteria', 35000, 'Income exceeds prescribed cap for EWS criteria', None),
        ('task-11', 'cust-11', 'svc-police', 'Maharashtra Police Verification for Security Guard Job', 'PROCESSING', 0, 7, 'Identity documents uploaded on Seva portal', 30000, None, None),
        ('task-12', 'cust-12', 'svc-passport', 'Tatkal Passport Fresh Application', 'PENDING', 1, 3, 'Annexure E draft prepared', 60000, None, None),
        ('task-13', 'cust-13', 'svc-bill', 'Gram Panchayat Tax Receipt & Mutation Print', 'DELIVERED', -4, -3, 'All 4 land records printed in duplicate', 10000, None, -3),
        ('task-14', 'cust-14', None, 'MSME Udyam Registration & Certificate', 'READY', -1, 1, 'Certificate generated with QR code, awaiting collection', 50000, None, None),
        ('task-15', 'cust-01', 'svc-aadhaar', 'Aadhaar PVC Card Online Order', 'PROCESSING', 3, 10, 'Order placed on UIDAI portal via speed post', 15000, None, None),
        ('task-16', 'cust-02', None, 'MHT-CET Entrance Exam Registration & Fee Paid', 'DELIVERED', -12, -10, 'Hall ticket downloaded and laminated', 80000, None, -10),
        ('task-17', 'cust-03', 'svc-income', 'Tehsildar Farmer Subsidy Solvency Certificate', 'PENDING', 2, 6, 'Awaiting Patwari signature on land valuer report', 40000, None, None),
        ('task-18', 'cust-04', 'svc-pan', 'Reprint of Damaged Physical PAN Card', 'READY', -2, 2, 'Speed post tracking active, dispatched', 20000, None, None),
        ('task-19', 'cust-05', 'svc-dl', 'RTO Smart Card Driving License Extract', 'DELIVERED', -6, -4, 'Certified extract delivered to transport office', 30000, None, -4),
        ('task-20', 'cust-06', 'svc-police', 'Passport Police Clearance Certificate (PCC)', 'PROCESSING', 1, 4, 'Interview scheduled at local police station', 35000, None, None),
        ('task-21', 'cust-07', 'svc-bill', 'Water Supply Bill Payment & Arrears Clear', 'PENDING', 0, 1, 'Waiting for online portal payment gateway to clear', 5000, None, None),
        ('task-22', 'cust-08', None, 'National Scholarship Portal (NSP) Application', 'PROCESSING', 2, 8, 'Bank account seeded with Aadhaar verified', 30000, None, None),
        ('task-23', 'cust-09', 'svc-dl', 'Learner License Computer Test Slot Booking', 'READY', -1, 3, 'Slot booked for Friday 11:30 AM', 45000, None, None),
        ('task-24', 'cust-10', 'svc-aadhaar', 'Child Aadhaar Baal Aadhaar Registration Slip', 'DELIVERED', -14, -13, 'Enrolment completed at center', 15000, None, -13),
        ('task-25', 'cust-11', None, 'Railway RRB NTPC Online Application Form', 'DELIVERED', -15, -14, 'Application submitted with photo upload', 25000, None, -14),
        ('task-26', 'cust-12', 'svc-passport', 'Visa Appointment File Preparation', 'PENDING', 3, 7, 'Schengen checklist checked, waiting for bank statements', 75000, None, None),
        ('task-27', 'cust-13', 'svc-caste', 'Caste Validity Committee Scrutiny Submission', 'PROCESSING', 1, 15, 'Affidavit Form 3 typed and notarized', 50000, None, None),
        ('task-28', 'cust-14', None, 'FSSAI Food License Basic Registration', 'DELIVERED', -8, -5, 'FSSAI 14-digit certificate issued', 100000, None, -5),
        ('task-29', 'cust-01', 'svc-bill', 'Broadband BSNL Fiber Bill Payment', 'DELIVERED', -3, -2, 'Bill paid via Bharat BillPay', 5000, None, -2),
        ('task-30', 'cust-general', None, 'Color Photostat & Document Scanning (20 Pages)', 'DELIVERED', 0, 0, 'Walk-in cash service, immediate delivery', 20000, None, 0),
    ]

    for t_id, c_id, s_id, title, st, sch_d, tar_d, notes, amt, cres, comp_d in tasks_data:
        sch_date = ymd_date(sch_d) if sch_d is not None else None
        tar_date = ymd_date(tar_d) if tar_d is not None else None
        comp_date = iso_date(comp_d) if comp_d is not None else None
        created = iso_date(sch_d - 2 if sch_d else -5)
        updated = comp_date if comp_date else created

        cur.execute(
            """INSERT INTO tasks (id, customer_id, service_id, title, status, scheduled_date, scheduled_time, target_date, notes, billing_amount, cancellation_reason, created_at, updated_at, completed_at)
               VALUES (?, ?, ?, ?, ?, ?, '10:00 AM', ?, ?, ?, ?, ?, ?, ?)""",
            (t_id, c_id, s_id, title, st, sch_date, tar_date, notes, amt, cres, created, updated, comp_date)
        )

    # 4. Payments (20 realistic payment records)
    payments_data = [
        ('pay-01', 'task-01', 25000, -2), # Full paid
        ('pay-02', 'task-02', 20000, -1), # Partial paid (due 15000)
        ('pay-03', 'task-03', 40000, -3), # Full paid
        ('pay-04', 'task-04', 15000, -2), # Full paid
        ('pay-05', 'task-05', 25000, 0),  # Partial paid (due 20000)
        ('pay-06', 'task-06', 60000, -2), # Full paid
        ('pay-07', 'task-07', 5000, -9),  # Full paid
        ('pay-08', 'task-09', 25000, -6), # Full paid
        ('pay-09', 'task-11', 30000, 0),  # Full paid
        ('pay-10', 'task-13', 10000, -3), # Full paid
        ('pay-11', 'task-14', 30000, -1), # Partial paid (due 20000)
        ('pay-12', 'task-15', 15000, -1), # Full paid
        ('pay-13', 'task-16', 80000, -10),# Full paid
        ('pay-14', 'task-18', 20000, -2), # Full paid
        ('pay-15', 'task-19', 30000, -4), # Full paid
        ('pay-16', 'task-20', 20000, 0),  # Partial paid (due 15000)
        ('pay-17', 'task-23', 45000, -1), # Full paid
        ('pay-18', 'task-24', 15000, -13),# Full paid
        ('pay-19', 'task-25', 25000, -14),# Full paid
        ('pay-20', 'task-30', 20000, 0),  # Full paid walk-in
    ]
    for p_id, t_id, p_amt, p_offset in payments_data:
        cur.execute(
            "INSERT INTO payments (id, task_id, amount, created_at) VALUES (?, ?, ?, ?)",
            (p_id, t_id, p_amt, iso_date(p_offset))
        )

    # 5. Banking Transactions (15 transactions with realistic details & Indian banking metadata)
    banking_data = [
        # (cust_id, type, mode, amount_paise, ref_no, metadata_dict, days_offset)
        (
            'cust-01', 'Transfer', 'Bank Transfer', 250000, 'UTR789214002341',
            {'from_account': 'Rajesh Sharma', 'beneficiary_bank': 'State Bank of India', 'beneficiary_account': '30987123456', 'beneficiary_ifsc': 'SBIN0001245', 'transaction_ref_no': 'UTR789214002341'},
            0
        ),
        (
            'cust-02', 'Transfer', 'UPI', 120000, 'UPI202610120045',
            {'sender_info': 'Priya Deshmukh', 'beneficiary_upi': 'college.fees@sbi', 'upi_transaction_id': 'UPI202610120045'},
            -1
        ),
        (
            'cust-03', 'Withdrawal', 'AePS (Aadhaar Enabled Payment System)', 500000, 'RRN984210345671',
            {'bank_name': 'Bank of Maharashtra', 'customer_aadhaar_number': '432187650987', 'terminal_rrn': 'RRN984210345671', 'auth_status': 'SUCCESS'},
            -1
        ),
        (
            'cust-04', 'Withdrawal', 'AePS (Aadhaar Enabled Payment System)', 200000, 'RRN984210345999',
            {'bank_name': 'Canara Bank', 'customer_aadhaar_number': '654321098765', 'terminal_rrn': 'RRN984210345999', 'auth_status': 'SUCCESS'},
            -2
        ),
        (
            'cust-05', 'Deposit', 'Cash to Bank Account', 1500000, 'DEP88200194821',
            {'target_bank': 'HDFC Bank Ltd', 'target_account': '50100234891234', 'target_ifsc': 'HDFC0000123', 'depositor_info': 'Vikram Jadhav (9158765432)', 'transaction_ref_no': 'DEP88200194821'},
            -2
        ),
        (
            'cust-06', 'Transfer', 'Bank Transfer', 750000, 'UTR998822114433',
            {'from_account': 'Meera Joshi', 'beneficiary_bank': 'Bank of Baroda', 'beneficiary_account': '00982345091', 'beneficiary_ifsc': 'BARB0POONA', 'transaction_ref_no': 'UTR998822114433'},
            -3
        ),
        (
            'cust-07', 'Withdrawal', 'Debit Card / Mini ATM', 400000, 'ATM776655443322',
            {'card_last_4': '4512', 'terminal_rrn': 'ATM776655443322', 'approval_code': 'APV849201'},
            -3
        ),
        (
            'cust-08', 'Deposit', 'Cash to UPI', 80000, 'UPI890123774411',
            {'target_upi': 'anjali.scholar@okhdfcbank', 'depositor_name': 'Anjali Gaikwad', 'transaction_ref_no': 'UPI890123774411'},
            -4
        ),
        (
            'cust-09', 'Withdrawal', 'AePS (Aadhaar Enabled Payment System)', 100000, 'RRN445566778899',
            {'bank_name': 'Union Bank of India', 'customer_aadhaar_number': '567890123456', 'terminal_rrn': 'RRN445566778899', 'auth_status': 'SUCCESS'},
            -5
        ),
        (
            'cust-10', 'Transfer', 'UPI', 50000, 'UPI992211883344',
            {'sender_info': 'Kavita Chavan', 'beneficiary_upi': 'ration.dealer@paytm', 'upi_transaction_id': 'UPI992211883344'},
            -5
        ),
        (
            'cust-11', 'Deposit', 'Cash to Bank Account', 300000, 'DEP112233445566',
            {'target_bank': 'Punjab National Bank', 'target_account': '19820015002938', 'target_ifsc': 'PUNB0198200', 'depositor_info': 'Dinesh Pawar', 'transaction_ref_no': 'DEP112233445566'},
            -6
        ),
        (
            'cust-12', 'Withdrawal', 'Debit Card / Mini ATM', 1000000, 'ATM998877665544',
            {'card_last_4': '8872', 'terminal_rrn': 'ATM998877665544', 'approval_code': 'APV993412'},
            -7
        ),
        (
            'cust-13', 'Withdrawal', 'UPI Cash-out', 150000, 'UPICASH12345678',
            {'customer_upi': 'suresh.tambe@upi', 'cash_handed_over_by': 'Counter Desk', 'transaction_ref_no': 'UPICASH12345678'},
            -8
        ),
        (
            'cust-14', 'Deposit', 'Cash to Bank Account', 2500000, 'DEP554433221100',
            {'target_bank': 'ICICI Bank', 'target_account': '001205012345', 'target_ifsc': 'ICIC0000012', 'depositor_info': 'Rohan Sawant Enterprises', 'transaction_ref_no': 'DEP554433221100'},
            -9
        ),
        (
            'cust-01', 'Withdrawal', 'AePS (Aadhaar Enabled Payment System)', 300000, 'RRN119922883377',
            {'bank_name': 'State Bank of India', 'customer_aadhaar_number': '845212349012', 'terminal_rrn': 'RRN119922883377', 'auth_status': 'SUCCESS'},
            -10
        ),
    ]

    for c_id, t_type, p_mode, amt, ref, meta, d_off in banking_data:
        cur.execute(
            """INSERT INTO banking_transactions (customer_id, transaction_type, payment_mode, amount, transaction_ref_no, metadata, transaction_date, is_deleted)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0)""",
            (c_id, t_type, p_mode, amt, ref, json.dumps(meta), iso_date(d_off))
        )

    # 6. Activities Log (10 entries)
    activities_data = [
        ('act-01', 'TASK_CREATED', 'Task Created', 'PAN Card Correction & Father Name Update created for Rajesh Sharma', 'task-01', 'cust-01', -2),
        ('act-02', 'PAYMENT_RECEIVED', 'Payment Recorded', 'Received ₹250 for PAN Card Correction & Father Name Update', 'task-01', 'cust-01', -2),
        ('act-03', 'TASK_STATUS_CHANGED', 'Status Updated', 'Tehsildar Income Certificate moved to PROCESSING', 'task-02', 'cust-02', -1),
        ('act-04', 'BANKING_TRANSACTION', 'Bank Transfer', 'Processed ₹2,500 Bank Transfer for Rajesh Sharma', None, 'cust-01', 0),
        ('act-05', 'BANKING_TRANSACTION', 'AePS Cash Withdrawal', 'Processed ₹5,000 AePS withdrawal for Amit Kulkarni', None, 'cust-03', -1),
        ('act-06', 'TASK_DELIVERED', 'Task Completed & Delivered', 'Aadhaar Mobile Link delivered to Sunita Patil', 'task-04', 'cust-04', -2),
        ('act-07', 'TASK_READY', 'Task Ready for Pickup', 'Passport Appointment Booking ready for Meera Joshi', 'task-06', 'cust-06', -2),
        ('act-08', 'BANKING_TRANSACTION', 'Cash Deposit to Bank', 'Deposited ₹15,000 to HDFC Bank for Vikram Jadhav', None, 'cust-05', -2),
        ('act-09', 'CUSTOMER_CREATED', 'Customer Registered', 'New customer profile created for Rohan Sawant', None, 'cust-14', -10),
        ('act-10', 'PAYMENT_RECEIVED', 'Payment Recorded', 'Received ₹200 for Photostat & Document Scanning', 'task-30', 'cust-general', 0),
    ]

    for a_id, a_type, title, desc, t_id, c_id, d_off in activities_data:
        cur.execute(
            """INSERT INTO activities (id, activity_type, title, description, task_id, customer_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (a_id, a_type, title, desc, t_id, c_id, iso_date(d_off))
        )

    # 7. App Settings
    cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('currency', 'INR');")
    cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('date_format', 'DD MMM YYYY');")
    cur.execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('app_version', '1.0.3');")

    conn.commit()
    conn.close()
    print(f"Sample test database successfully created at: {output_path}")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    
    # 1. Output inside the project root for easy reference
    local_db_path = os.path.join(project_root, "sample_data_50_records.db")
    create_sample_database(local_db_path)

    # 2. Output directly to user's Downloads folder
    user_downloads_dir = os.path.expanduser("~/Downloads")
    if os.path.exists(user_downloads_dir):
        downloads_db_path = os.path.join(user_downloads_dir, "sample_data_50_records.db")
        shutil.copy2(local_db_path, downloads_db_path)
        print(f"Copied sample database to Downloads: {downloads_db_path}")

    # 3. Output into DeskLog AppData backups folder so it immediately appears in default backups if checked!
    appdata_backups = os.path.expandvars(r"%APPDATA%\com.desklog.manager\backups")
    if os.path.exists(os.path.expandvars(r"%APPDATA%\com.desklog.manager")):
        os.makedirs(appdata_backups, exist_ok=True)
        appdata_db_path = os.path.join(appdata_backups, "sample_data_50_records.db")
        shutil.copy2(local_db_path, appdata_db_path)
        print(f"Copied sample database to AppData backups: {appdata_db_path}")
