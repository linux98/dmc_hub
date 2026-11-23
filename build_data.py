# -*- coding: utf-8 -*-
"""
DMC Hub Data Builder
Generates data.js from raw SchoolMIS CSV files.
Maintains two-tier naming architecture (official legal name + clean display name)
and geographic/cluster metadata (Amphoe + Sahawitthayakhet).
"""
import json
import os

SCHOOL_SHORT_NAMES = {
    '47012007': 'เฉลิมพระเกียรติฯ ๕๐ ปี สกลนคร'
}

SCHOOL_GEO = {
    '47012001': {'amphoe': 'เมืองสกลนคร', 'cluster': 'สหวิทยาเขตเมืองสกลนคร'},
    '47012002': {'amphoe': 'เมืองสกลนคร', 'cluster': 'สหวิทยาเขตเมืองสกลนคร'},
    '47012003': {'amphoe': 'เมืองสกลนคร', 'cluster': 'สหวิทยาเขตเมืองสกลนคร'},
    '47012004': {'amphoe': 'เมืองสกลนคร', 'cluster': 'สหวิทยาเขตเมืองสกลนคร'},
    '47012005': {'amphoe': 'เมืองสกลนคร', 'cluster': 'สหวิทยาเขตเมืองสกลนคร'},
    '47012007': {'amphoe': 'เมืองสกลนคร', 'cluster': 'สหวิทยาเขตเมืองสกลนคร'},
    '47012008': {'amphoe': 'กุสุมาลย์', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012009': {'amphoe': 'กุสุมาลย์', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012010': {'amphoe': 'เต่างอย', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012011': {'amphoe': 'โคกศรีสุพรรณ', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012012': {'amphoe': 'โคกศรีสุพรรณ', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012013': {'amphoe': 'โพนนาแก้ว', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012014': {'amphoe': 'ภูพาน', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47012015': {'amphoe': 'ภูพาน', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47022001': {'amphoe': 'พังโคน', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022002': {'amphoe': 'กุดบาก', 'cluster': 'สหวิทยาเขตพรรณา-กุดบาก'},
    '47022003': {'amphoe': 'พรรณานิคม', 'cluster': 'สหวิทยาเขตพรรณา-กุดบาก'},
    '47022004': {'amphoe': 'พรรณานิคม', 'cluster': 'สหวิทยาเขตพรรณา-กุดบาก'},
    '47022005': {'amphoe': 'พังโคน', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022007': {'amphoe': 'พังโคน', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022008': {'amphoe': 'พรรณานิคม', 'cluster': 'สหวิทยาเขตพรรณา-กุดบาก'},
    '47022009': {'amphoe': 'พรรณานิคม', 'cluster': 'สหวิทยาเขตพรรณา-กุดบาก'},
    '47022010': {'amphoe': 'พรรณานิคม', 'cluster': 'สหวิทยาเขตพรรณา-กุดบาก'},
    '47022012': {'amphoe': 'วาริชภูมิ', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022013': {'amphoe': 'วาริชภูมิ', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022014': {'amphoe': 'วาริชภูมิ', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022015': {'amphoe': 'นิคมน้ำอูน', 'cluster': 'สหวิทยาเขตวาริช-พังโคน-น้ำอูน'},
    '47022016': {'amphoe': 'สว่างแดนดิน', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47022017': {'amphoe': 'สว่างแดนดิน', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47022018': {'amphoe': 'สว่างแดนดิน', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47022019': {'amphoe': 'สว่างแดนดิน', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47022020': {'amphoe': 'สว่างแดนดิน', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47022021': {'amphoe': 'สว่างแดนดิน', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47022022': {'amphoe': 'ส่องดาว', 'cluster': 'สหวิทยาเขตสว่างแดนดิน-ส่องดาว'},
    '47032001': {'amphoe': 'วานรนิวาส', 'cluster': 'สหวิทยาเขตวานร-คำตากล้า'},
    '47032002': {'amphoe': 'คำตากล้า', 'cluster': 'สหวิทยาเขตวานร-คำตากล้า'},
    '47032003': {'amphoe': 'วานรนิวาส', 'cluster': 'สหวิทยาเขตวานร-คำตากล้า'},
    '47032004': {'amphoe': 'วานรนิวาส', 'cluster': 'สหวิทยาเขตวานร-คำตากล้า'},
    '47032007': {'amphoe': 'วานรนิวาส', 'cluster': 'สหวิทยาเขตวานร-คำตากล้า'},
    '47032009': {'amphoe': 'บ้านม่วง', 'cluster': 'สหวิทยาเขตบ้านม่วง-อากาศ-เจริญศิลป์'},
    '47032010': {'amphoe': 'ภูพาน', 'cluster': 'สหวิทยาเขตเบญจมิตร'},
    '47032012': {'amphoe': 'อากาศอำนวย', 'cluster': 'สหวิทยาเขตบ้านม่วง-อากาศ-เจริญศิลป์'},
    '47032013': {'amphoe': 'อากาศอำนวย', 'cluster': 'สหวิทยาเขตบ้านม่วง-อากาศ-เจริญศิลป์'},
    '47032014': {'amphoe': 'อากาศอำนวย', 'cluster': 'สหวิทยาเขตบ้านม่วง-อากาศ-เจริญศิลป์'},
    '47032015': {'amphoe': 'เจริญศิลป์', 'cluster': 'สหวิทยาเขตบ้านม่วง-อากาศ-เจริญศิลป์'}
}

CSV_FILES = {
    'y68_1': '2568-1-schoolmis.csv',
    'y68_2': '2568-2-schoolmis.csv',
    'y68_3': '2568-3-schoolmis.csv',
    'y69_1': '2569-1-schoolmis.csv',
    'y69_2': '2569-2-schoolmis.csv'
}

def build():
    data_by_period = {}
    school_order = []
    school_info = {}

    for p_key, filename in CSV_FILES.items():
        if not os.path.exists(filename):
            print(f"Warning: File {filename} not found!")
            continue

        with open(filename, 'r', encoding='cp874') as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]
            for row_str in lines[1:46]: # 45 schools
                row = row_str.split(',')
                sch_id = row[2]
                sch_name = row[3]
                dist_id = row[0]
                dist_name = row[1]
                
                geo = SCHOOL_GEO.get(sch_id, {'amphoe': 'สกลนคร', 'cluster': 'ทั่วไป'})

                if sch_id not in school_order:
                    school_order.append(sch_id)
                    school_info[sch_id] = {
                        'id': sch_id,
                        'name': sch_name,
                        'shortName': SCHOOL_SHORT_NAMES.get(sch_id, sch_name),
                        'districtId': dist_id,
                        'districtName': dist_name,
                        'amphoe': geo['amphoe'],
                        'cluster': geo['cluster']
                    }
                
                p_data = {
                    'grades': {
                        'ม1': {'m': int(row[48]), 'f': int(row[49]), 'total': int(row[50]), 'rooms': int(row[51])},
                        'ม2': {'m': int(row[52]), 'f': int(row[53]), 'total': int(row[54]), 'rooms': int(row[55])},
                        'ม3': {'m': int(row[56]), 'f': int(row[57]), 'total': int(row[58]), 'rooms': int(row[59])},
                        'ม4': {'m': int(row[64]), 'f': int(row[65]), 'total': int(row[66]), 'rooms': int(row[67])},
                        'ม5': {'m': int(row[68]), 'f': int(row[69]), 'total': int(row[70]), 'rooms': int(row[71])},
                        'ม6': {'m': int(row[72]), 'f': int(row[73]), 'total': int(row[74]), 'rooms': int(row[75])}
                    },
                    'levels': {
                        'มต้น': {'m': int(row[60]), 'f': int(row[61]), 'total': int(row[62]), 'rooms': int(row[63])},
                        'มปลาย': {'m': int(row[88]), 'f': int(row[89]), 'total': int(row[90]), 'rooms': int(row[91])}
                    },
                    'total': {
                        'm': int(row[92]), 'f': int(row[93]), 'total': int(row[94]), 'rooms': int(row[95])
                    }
                }
                if p_key not in data_by_period:
                    data_by_period[p_key] = {}
                data_by_period[p_key][sch_id] = p_data

    dashboard_data = []
    for sch_id in school_order:
        item = {
            'id': school_info[sch_id]['id'],
            'name': school_info[sch_id]['name'],
            'shortName': school_info[sch_id]['shortName'],
            'districtId': school_info[sch_id]['districtId'],
            'districtName': school_info[sch_id]['districtName'],
            'amphoe': school_info[sch_id]['amphoe'],
            'cluster': school_info[sch_id]['cluster'],
            'y68': data_by_period.get('y68_1', {}).get(sch_id, {}),
            'y68_1': data_by_period.get('y68_1', {}).get(sch_id, {}),
            'y68_2': data_by_period.get('y68_2', {}).get(sch_id, {}),
            'y68_3': data_by_period.get('y68_3', {}).get(sch_id, {}),
            'y69_1': data_by_period.get('y69_1', {}).get(sch_id, {}),
            'y69_2': data_by_period.get('y69_2', {}).get(sch_id, {})
        }
        dashboard_data.append(item)

    out_content = '// Auto-generated data file for DMC Dashboard (5 Periods with Two-Tier Naming Architecture)\n'
    out_content += 'const DASHBOARD_DATA = ' + json.dumps(dashboard_data, ensure_ascii=False, indent=2) + ';\n'

    with open('data.js', 'w', encoding='utf-8') as f:
        f.write(out_content)

    print(f"Successfully generated data.js! Total schools: {len(dashboard_data)}")
    for s in dashboard_data[:3]:
        print(f"School {s['id']} - {s['name']}: Amphoe = {s['amphoe']}, Cluster = {s['cluster']}")

if __name__ == '__main__':
    build()
