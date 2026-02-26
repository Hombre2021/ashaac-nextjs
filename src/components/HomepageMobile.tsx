import HomepageSections from './HomepageSections';
import styles from './HomepageMobile.module.css';

export default function HomepageMobile() {
  return (
    <div className={styles.homepageMobile}>
      <HomepageSections />
    </div>
  );
}
