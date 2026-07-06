import ReactQuill from 'react-quill-new';

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'blockquote'],
    ['clean'],
  ],
};

// Controlled rich-text editor that plays nicely with Ant Design's Form.
export default function RichText({ value, onChange, placeholder }) {
  return (
    <div className="rich-text">
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
    </div>
  );
}
