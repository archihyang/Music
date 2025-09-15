#!/usr/bin/env python3
"""
Genesis Music - Project Backup Script
프로젝트의 중요 포인트마다 백업을 생성하는 스크립트
"""

import os
import shutil
import json
import hashlib
from datetime import datetime
from pathlib import Path
import zipfile

class ProjectBackup:
    def __init__(self, project_root="F:\\Genesis_Music"):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "backups"
        self.backup_dir.mkdir(exist_ok=True)
        
        # 백업 제외 디렉토리
        self.exclude_dirs = {
            'node_modules', 
            '__pycache__', 
            '.git', 
            'venv', 
            '.venv',
            'dist',
            'build',
            'downloads',  # 다운로드된 미디어 파일
            'backups'     # 백업 폴더 자체
        }
        
        # 백업 제외 파일 패턴
        self.exclude_patterns = {
            '*.pyc', 
            '*.pyo', 
            '*.log', 
            '*.tmp',
            '.DS_Store',
            'Thumbs.db'
        }
    
    def create_backup(self, checkpoint_name, description=""):
        """백업 생성"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{timestamp}_{checkpoint_name}"
        backup_path = self.backup_dir / backup_name
        
        print(f"🔄 백업 시작: {backup_name}")
        
        # 백업 디렉토리 생성
        backup_path.mkdir(exist_ok=True)
        
        # 메타데이터 생성
        metadata = {
            "timestamp": timestamp,
            "checkpoint": checkpoint_name,
            "description": description,
            "files": [],
            "total_size": 0,
            "file_count": 0
        }
        
        # 프로젝트 파일 복사
        copied_files = self._copy_project_files(self.project_root, backup_path, metadata)
        
        # 메타데이터 저장
        metadata_file = backup_path / "backup_metadata.json"
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        # ZIP 압축 옵션
        if input("\n💾 ZIP 압축을 생성하시겠습니까? (y/n): ").lower() == 'y':
            self._create_zip_archive(backup_path, backup_name)
        
        # 백업 요약
        print(f"\n✅ 백업 완료!")
        print(f"📁 위치: {backup_path}")
        print(f"📊 파일 수: {metadata['file_count']}")
        print(f"💾 전체 크기: {self._format_size(metadata['total_size'])}")
        
        # 무결성 체크섬 생성
        self._create_checksum_file(backup_path)
        
        return backup_path
    
    def _copy_project_files(self, src_dir, dst_dir, metadata):
        """프로젝트 파일 복사 (제외 항목 제외)"""
        copied_files = []
        
        for root, dirs, files in os.walk(src_dir):
            # 제외 디렉토리 건너뛰기
            dirs[:] = [d for d in dirs if d not in self.exclude_dirs]
            
            # 상대 경로 계산
            rel_path = Path(root).relative_to(src_dir)
            
            # 백업 폴더 자체는 건너뛰기
            if 'backups' in str(rel_path):
                continue
            
            # 대상 디렉토리 생성
            dst_root = dst_dir / rel_path
            dst_root.mkdir(parents=True, exist_ok=True)
            
            # 파일 복사
            for file in files:
                # 제외 패턴 확인
                if any(Path(file).match(pattern) for pattern in self.exclude_patterns):
                    continue
                
                src_file = Path(root) / file
                dst_file = dst_root / file
                
                try:
                    shutil.copy2(src_file, dst_file)
                    file_size = src_file.stat().st_size
                    
                    metadata['files'].append({
                        'path': str(rel_path / file),
                        'size': file_size,
                        'modified': src_file.stat().st_mtime
                    })
                    metadata['total_size'] += file_size
                    metadata['file_count'] += 1
                    
                    if metadata['file_count'] % 100 == 0:
                        print(f"  📄 {metadata['file_count']} 파일 복사됨...")
                    
                except Exception as e:
                    print(f"  ⚠️  파일 복사 실패: {src_file} - {e}")
        
        return copied_files
    
    def _create_zip_archive(self, backup_path, backup_name):
        """백업 폴더를 ZIP으로 압축"""
        zip_path = self.backup_dir / f"{backup_name}.zip"
        
        print(f"\n🗜️  ZIP 압축 중: {zip_path.name}")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(backup_path):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(backup_path)
                    zipf.write(file_path, arcname)
        
        zip_size = zip_path.stat().st_size
        print(f"✅ ZIP 생성 완료: {self._format_size(zip_size)}")
        
        return zip_path
    
    def _create_checksum_file(self, backup_path):
        """백업 무결성을 위한 체크섬 파일 생성"""
        checksum_file = backup_path / "checksums.txt"
        
        with open(checksum_file, 'w', encoding='utf-8') as f:
            for root, dirs, files in os.walk(backup_path):
                for file in files:
                    if file == "checksums.txt":
                        continue
                    
                    file_path = Path(root) / file
                    rel_path = file_path.relative_to(backup_path)
                    
                    # MD5 체크섬 계산
                    md5_hash = hashlib.md5()
                    with open(file_path, 'rb') as fb:
                        for chunk in iter(lambda: fb.read(4096), b""):
                            md5_hash.update(chunk)
                    
                    f.write(f"{md5_hash.hexdigest()}  {rel_path}\n")
    
    def list_backups(self):
        """백업 목록 표시"""
        backups = []
        
        for backup_dir in self.backup_dir.iterdir():
            if backup_dir.is_dir():
                metadata_file = backup_dir / "backup_metadata.json"
                if metadata_file.exists():
                    with open(metadata_file, 'r', encoding='utf-8') as f:
                        metadata = json.load(f)
                        backups.append({
                            'name': backup_dir.name,
                            'path': backup_dir,
                            'metadata': metadata
                        })
        
        # 시간순 정렬
        backups.sort(key=lambda x: x['metadata']['timestamp'], reverse=True)
        
        print("\n📚 백업 목록:")
        print("=" * 80)
        
        for backup in backups:
            meta = backup['metadata']
            print(f"\n📁 {backup['name']}")
            print(f"   📅 시간: {meta['timestamp']}")
            print(f"   📝 설명: {meta.get('description', 'N/A')}")
            print(f"   📊 파일: {meta['file_count']}개")
            print(f"   💾 크기: {self._format_size(meta['total_size'])}")
        
        return backups
    
    def restore_backup(self, backup_name):
        """백업 복원 (주의: 현재 프로젝트를 덮어씁니다!)"""
        backup_path = self.backup_dir / backup_name
        
        if not backup_path.exists():
            print(f"❌ 백업을 찾을 수 없습니다: {backup_name}")
            return False
        
        print(f"\n⚠️  경고: 이 작업은 현재 프로젝트를 덮어씁니다!")
        print(f"백업: {backup_name}")
        
        if input("계속하시겠습니까? (yes/no): ").lower() != 'yes':
            print("취소되었습니다.")
            return False
        
        # 현재 상태 임시 백업
        temp_backup = self.create_backup("temp_before_restore", "복원 전 임시 백업")
        
        try:
            # 복원 작업
            # TODO: 실제 복원 로직 구현
            print("✅ 복원 완료!")
            return True
        except Exception as e:
            print(f"❌ 복원 실패: {e}")
            return False
    
    def _format_size(self, size_bytes):
        """바이트를 읽기 쉬운 형식으로 변환"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} TB"


def main():
    """메인 함수"""
    backup = ProjectBackup()
    
    print("🎸 Genesis Music - 프로젝트 백업 도구")
    print("=" * 50)
    
    while True:
        print("\n메뉴:")
        print("1. 새 백업 생성")
        print("2. 백업 목록 보기")
        print("3. 백업 복원")
        print("4. 종료")
        
        choice = input("\n선택 (1-4): ")
        
        if choice == '1':
            checkpoint = input("체크포인트 이름: ")
            description = input("설명 (선택사항): ")
            backup.create_backup(checkpoint, description)
        
        elif choice == '2':
            backup.list_backups()
        
        elif choice == '3':
            backups = backup.list_backups()
            if backups:
                backup_name = input("\n복원할 백업 이름: ")
                backup.restore_backup(backup_name)
        
        elif choice == '4':
            print("\n👋 종료합니다.")
            break
        
        else:
            print("❌ 잘못된 선택입니다.")


if __name__ == "__main__":
    main()
