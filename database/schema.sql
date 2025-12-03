-- Supabaseで実行するSQLスクリプト

-- ドキュメントテーブル
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'txt')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content TEXT,
  summary JSONB,
  summary_status TEXT DEFAULT 'pending' CHECK (summary_status IN ('pending', 'processing', 'completed', 'error')),
  url TEXT,
  public_url TEXT,
  file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_summary_status ON documents(summary_status);

-- RLS (Row Level Security) ポリシー
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- すべてのユーザーが匿名でアクセス可能（認証機能は後で追加）
CREATE POLICY "Allow anonymous access" ON documents
  FOR ALL USING (true);

-- ストレージバケットの作成（Supabase UIで実行）
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

-- ストレージポリシー
CREATE POLICY "Allow anonymous upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow anonymous read" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Allow anonymous delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents');

-- 更新日時の自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();