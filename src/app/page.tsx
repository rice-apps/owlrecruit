import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div>OwlRecruit</div>
      </main>
      <footer className={styles.footer}>
        <div>Empty Footer</div>
      </footer>
    </div>
  );
}
